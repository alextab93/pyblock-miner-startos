const elements = Object.fromEntries(
  [
    "state-label",
    "hashrate",
    "worker-summary",
    "uptime",
    "network",
    "pool",
    "accepted",
    "rejected",
    "rejection-rate",
    "best-share",
    "blocks",
    "pool-height",
    "events",
    "updated",
    "chart-line",
    "chart-area",
    "chart-min",
    "chart-max",
    "hashrate-chart",
    "chart-guide",
    "chart-point",
    "chart-tooltip",
    "miners",
  ].map((id) => [id, document.getElementById(id)]),
)

const chartPanel = document.querySelector(".chart-panel")
const eventsPanel = document.querySelector(".events-panel")

let chartValues = []
let chartPoints = []
let selectedChartIndex = -1

const poolNames = {
  "pool.pyblock.xyz:4445": "Lotto",
  "pool.pyblock.xyz:5574": "Chirp",
  "pool.pyblock.xyz:30110": "Carousel",
  "pool.pyblock.xyz:23111": "Testnet4",
  "pool.pyblock.xyz:23110": "Regtest",
}

function formatHashrate(hashesPerSecond) {
  const value = Math.max(0, Number(hashesPerSecond) || 0)
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} GH/s`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MH/s`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)} kH/s`
  if (value > 0) return `${value.toFixed(2)} H/s`
  return "0 H/s"
}

function formatPool(pool) {
  const endpoint = String(pool || "").trim()
  if (!endpoint) return "Unavailable"
  const normalized = endpoint
    .replace(/^stratum\+tcp:\/\//i, "")
    .replace(/\/$/, "")
    .toLowerCase()
  const name = poolNames[normalized]
  return name ? `${name} · ${endpoint}` : endpoint
}

function formatDuration(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0))
  if (value === 0) return "Session not started"
  const days = Math.floor(value / 86400)
  const hours = Math.floor((value % 86400) / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours || days) parts.push(`${hours}h`)
  parts.push(`${minutes}m uptime`)
  return parts.join(" ")
}

function formatNumber(value, fallback = "Unavailable") {
  if (value === null || value === undefined || value === "") return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : fallback
}

function formatWorkerDetail(workers, workerCount) {
  const names = Array.isArray(workers)
    ? workers.map((worker) => worker?.name).filter(Boolean)
    : []
  const cpu = names.length === 1 ? names[0].match(/^CPU \((\d+) threads?\)$/i) : null
  if (cpu) return { label: "CPU threads", value: cpu[1], title: names[0] }
  if (names.length) {
    return { label: "Workers", value: names.join(", "), title: names.join(", ") }
  }
  return { label: "Workers", value: formatNumber(workerCount), title: "" }
}

function syncEventsHeight() {
  if (!chartPanel || !eventsPanel) return
  const height = Math.ceil(chartPanel.getBoundingClientRect().height)
  if (height > 0) {
    eventsPanel.style.height = `${height}px`
  }
}

function createMinerDetail(label, value, title) {
  const row = document.createElement("div")
  row.className = "miner-detail"
  const key = document.createElement("span")
  key.className = "miner-detail-label"
  key.textContent = label
  const content = document.createElement("span")
  content.className = "miner-detail-value"
  content.textContent = value
  if (title) content.title = title
  row.append(key, content)
  return row
}

function drawChart(samples) {
  const values = Array.isArray(samples)
    ? samples.map(Number).filter(Number.isFinite).slice(-120)
    : []
  const displayValues = values.length > 1 ? values : [0, values[0] || 0]
  const peak = Math.max(...displayValues, 1)
  const floor = Math.min(...displayValues)
  const range = Math.max(peak - floor, peak * 0.08, 1)
  const points = displayValues.map((value, index) => {
    const x = (index / (displayValues.length - 1)) * 800
    const y = 170 - ((value - floor) / range) * 150
    return [x, Math.min(170, Math.max(20, y))]
  })
  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
  const area = `M${points[0][0].toFixed(2)} 180 L${points
    .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" L")} L${points.at(-1)[0].toFixed(2)} 180 Z`
  elements["chart-line"].setAttribute("points", line)
  elements["chart-area"].setAttribute("d", area)
  elements["chart-min"].textContent = `Min ${formatHashrate(floor)}`
  elements["chart-max"].textContent = `Peak ${formatHashrate(Math.max(...displayValues))}`
  setChartData(displayValues, points)
}

function setChartData(values, points) {
  chartValues = values
  chartPoints = points
  if (selectedChartIndex >= chartValues.length) selectedChartIndex = chartValues.length - 1
  if (selectedChartIndex >= 0 && !elements["chart-tooltip"].hidden) {
    showChartSample(selectedChartIndex)
  }
}

function chartSampleLabel(index) {
  const distance = chartValues.length - 1 - index
  if (distance === 0) return "Latest sample"
  if (distance === 1) return "1 sample earlier"
  return `${distance} samples earlier`
}

function showChartSample(index) {
  if (!chartValues.length || !chartPoints.length) return
  selectedChartIndex = Math.min(chartValues.length - 1, Math.max(0, index))
  const [x, y] = chartPoints[selectedChartIndex]
  const value = formatHashrate(chartValues[selectedChartIndex])
  const label = chartSampleLabel(selectedChartIndex)
  elements["chart-guide"].setAttribute("x1", x)
  elements["chart-guide"].setAttribute("x2", x)
  elements["chart-guide"].hidden = false
  elements["chart-point"].setAttribute("cx", x)
  elements["chart-point"].setAttribute("cy", y)
  elements["chart-point"].hidden = false
  elements["chart-tooltip"].textContent = `${value} · ${label}`
  elements["chart-tooltip"].hidden = false
  elements["chart-tooltip"].style.left = `${(x / 800) * 100}%`
  elements["chart-tooltip"].style.top = `${(y / 180) * 100}%`
  const horizontalOffset = x < 100 ? "0" : x > 700 ? "-100%" : "-50%"
  const verticalOffset = y < 48 ? "16px" : "calc(-100% - 12px)"
  elements["chart-tooltip"].style.transform = `translate(${horizontalOffset}, ${verticalOffset})`
  elements["hashrate-chart"].setAttribute("aria-label", `${value}, ${label}`)
}

function hideChartSample() {
  selectedChartIndex = -1
  elements["chart-guide"].hidden = true
  elements["chart-point"].hidden = true
  elements["chart-tooltip"].hidden = true
  elements["hashrate-chart"].removeAttribute("aria-label")
}

function chartIndexFromPointer(event) {
  const bounds = elements["hashrate-chart"].getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
  return Math.round(ratio * (chartValues.length - 1))
}

elements["hashrate-chart"].addEventListener("pointermove", (event) => {
  showChartSample(chartIndexFromPointer(event))
})

elements["hashrate-chart"].addEventListener("pointerleave", () => {
  if (document.activeElement !== elements["hashrate-chart"]) hideChartSample()
})

elements["hashrate-chart"].addEventListener("focus", () => {
  showChartSample(selectedChartIndex >= 0 ? selectedChartIndex : chartValues.length - 1)
})

elements["hashrate-chart"].addEventListener("blur", hideChartSample)

elements["hashrate-chart"].addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
  event.preventDefault()
  if (event.key === "Home") showChartSample(0)
  else if (event.key === "End") showChartSample(chartValues.length - 1)
  else if (event.key === "ArrowLeft") showChartSample(Math.max(0, selectedChartIndex - 1))
  else showChartSample(Math.min(chartValues.length - 1, selectedChartIndex + 1))
})

function renderEvents(events) {
  elements.events.replaceChildren()
  const values = Array.isArray(events) && events.length ? events : ["No events yet"]
  for (const event of values) {
    const item = document.createElement("li")
    item.textContent = event
    elements.events.append(item)
  }
}

function createMinerCard(miner, isPrimary, showSessionResults) {
  const card = document.createElement("article")
  card.className = "miner-card"
  const header = document.createElement("header")
  const name = document.createElement("div")
  name.className = "miner-name"
  name.textContent = isPrimary ? `${miner.minerName} (primary)` : miner.minerName
  const state = document.createElement("div")
  state.className = "miner-state"
  state.textContent = miner.stateLabel || "Unavailable"
  const rate = document.createElement("div")
  rate.className = "miner-rate"
  rate.textContent = miner.hashrate || "0 H/s"
  const meta = document.createElement("div")
  meta.className = "miner-meta"
  const worker = formatWorkerDetail(miner.workers, miner.workerCount)
  const details = [
    createMinerDetail("Pool", formatPool(miner.pool), miner.pool || ""),
    createMinerDetail(
      "Payout",
      miner.payoutAddress || "Unavailable",
      miner.payoutAddress || "",
    ),
    createMinerDetail(
      "Pool difficulty",
      miner.currentDifficulty || "Unavailable",
    ),
    createMinerDetail(worker.label, worker.value, worker.title),
    createMinerDetail("Network", miner.network || "Unknown"),
  ]
  if (showSessionResults) {
    details.push(
      createMinerDetail("Accepted shares", formatNumber(miner.accepted)),
      createMinerDetail("Rejected shares", formatNumber(miner.rejected)),
      createMinerDetail("Best diff", miner.bestShare || "Unavailable"),
    )
  }
  meta.append(...details)
  header.append(name, state)
  card.append(header, rate, meta)
  return card
}

function aggregateFleet(fleet) {
  const peers = Array.isArray(fleet?.peers) ? fleet.peers : []
  const configuredMiners = [
    { name: fleet?.primary?.minerName || "Miner 1", status: fleet?.primary },
    ...peers,
  ]
  const statuses = configuredMiners.map((miner) => miner?.status).filter(Boolean)
  if (!statuses.length) {
    return null
  }
  const totalHashrate = statuses.reduce(
    (sum, item) => sum + Number(item.hashrateHps || 0),
    0,
  )
  const totalAccepted = statuses.reduce(
    (sum, item) => sum + Number(item.accepted || 0),
    0,
  )
  const totalRejected = statuses.reduce(
    (sum, item) => sum + Number(item.rejected || 0),
    0,
  )
  const totalBlocks = statuses.reduce(
    (sum, item) => sum + Number(item.blocks || 0),
    0,
  )
  const bestShare = statuses.reduce(
    (best, item) =>
      Number(item.bestShareValue || 0) > Number(best?.bestShareValue || 0)
        ? item
        : best,
    statuses[0],
  )
  const activeStatuses = statuses.filter((item) => item.connected)
  const workerCount = statuses.reduce(
    (sum, item) => sum + Number(item.workerCount || 0),
    0,
  )
  const uniqueNetworks = [...new Set(statuses.map((item) => item.network).filter(Boolean))]
  const uniquePools = [...new Set(statuses.map((item) => item.pool).filter(Boolean))]
  const history = []
  const maxHistory = Math.max(
    ...statuses.map((item) =>
      Array.isArray(item.hashrateHistoryHps) ? item.hashrateHistoryHps.length : 0,
    ),
    0,
  )
  for (let index = 0; index < maxHistory; index += 1) {
    let sum = 0
    let seen = false
    for (const status of statuses) {
      const historyValues = Array.isArray(status.hashrateHistoryHps)
        ? status.hashrateHistoryHps
        : []
      const sample = historyValues[historyValues.length - maxHistory + index]
      if (Number.isFinite(sample)) {
        sum += Number(sample)
        seen = true
      }
    }
    if (seen) history.push(sum)
  }
  const eventLines = []
  for (const status of statuses) {
    for (const event of Array.isArray(status.events) ? status.events : []) {
      eventLines.push(`[${status.minerName}] ${event}`)
    }
  }
  return {
    state: activeStatuses.length ? (activeStatuses.some((item) => item.state === "mining") ? "mining" : "connected") : "waiting",
    stateLabel:
      activeStatuses.length === statuses.length
        ? "Mining"
        : activeStatuses.length
          ? "Partially online"
          : "Waiting for pool",
    hashrate: formatHashrate(totalHashrate),
    workerCount,
    uptimeSeconds: Math.max(
      0,
      ...statuses.map((item) => Number(item.uptimeSeconds || 0)),
    ),
    network:
      uniqueNetworks.length === 1
        ? uniqueNetworks[0]
        : uniqueNetworks.length > 1
          ? "Mixed"
          : "Unknown",
    pool:
      uniquePools.length === 1
        ? uniquePools[0]
        : uniquePools.length > 1
          ? `${uniquePools.length} pools`
          : "Waiting for configuration",
    accepted: totalAccepted,
    rejected: totalRejected,
    rejectionRate:
      totalAccepted + totalRejected > 0
        ? (totalRejected / (totalAccepted + totalRejected)) * 100
        : 0,
    bestShare: bestShare?.bestShare || "0.00",
    blocks: totalBlocks,
    poolHeight: statuses.find((item) => item.poolHeight != null)?.poolHeight,
    events: eventLines,
    hashrateHistoryHps: history,
    miners: configuredMiners.map((item, index) => ({
      minerName: item?.status?.minerName || item?.name || `Miner ${index + 1}`,
      stateLabel: item?.status?.stateLabel || (item?.status ? "Online" : "Unavailable"),
      hashrate: item?.status?.hashrate || "0 H/s",
      pool: item?.status?.pool || "Unavailable",
      payoutAddress: item?.status?.payoutAddress || "Unavailable",
      currentDifficulty: item?.status?.currentDifficulty || "Unavailable",
      workers: item?.status?.workers,
      workerCount: item?.status?.workerCount,
      network: item?.status?.network || "Unknown",
      accepted: item?.status?.accepted,
      rejected: item?.status?.rejected,
      bestShare: item?.status?.bestShare,
    })),
  }
}

function render(fleet) {
  const status = aggregateFleet(fleet)
  if (!status) {
    renderFailure()
    return
  }
  document.body.dataset.state = status.state
  elements["state-label"].textContent = status.stateLabel
  elements.hashrate.textContent = status.hashrate
  elements["worker-summary"].textContent = `${status.workerCount} ${
    status.workerCount === 1 ? "worker" : "workers"
  }`
  elements.uptime.textContent = formatDuration(status.uptimeSeconds)
  elements.network.textContent = status.network || "Unknown"
  elements.pool.textContent = formatPool(status.pool || "Waiting for configuration")
  elements.pool.title = status.pool || ""
  elements["pool-height"].textContent = status.poolHeight
    ? formatNumber(status.poolHeight)
    : "Unavailable"
  elements.accepted.textContent = formatNumber(status.accepted, "0")
  elements.rejected.textContent = formatNumber(status.rejected, "0")
  elements["rejection-rate"].textContent = `${Number(status.rejectionRate || 0).toFixed(1)}% rejection rate`
  elements["best-share"].textContent = status.bestShare
  elements.blocks.textContent = formatNumber(status.blocks, "0")
  renderEvents(status.events)
  drawChart(status.hashrateHistoryHps)
  elements.miners.replaceChildren()
  for (const [index, miner] of status.miners.entries()) {
    elements.miners.append(
      createMinerCard(miner, index === 0, status.miners.length > 1),
    )
  }
  elements.updated.textContent = `Updated ${new Date().toLocaleTimeString()}`
}

function renderFailure() {
  document.body.dataset.state = "error"
  elements["state-label"].textContent = "Status unavailable"
  elements.updated.textContent = "Update failed, retrying"
}

if (chartPanel && eventsPanel) {
  const observer = new ResizeObserver(() => {
    syncEventsHeight()
  })
  observer.observe(chartPanel)
  window.addEventListener("resize", syncEventsHeight)
  window.addEventListener("load", syncEventsHeight)
  queueMicrotask(syncEventsHeight)
}

async function refresh() {
  try {
    const response = await fetch("/api/miners", { cache: "no-store" })
    if (!response.ok) throw new Error(`Status request failed: ${response.status}`)
    render(await response.json())
  } catch {
    try {
      const response = await fetch("/api/status", { cache: "no-store" })
      if (!response.ok) throw new Error(`Status request failed: ${response.status}`)
      render({ primary: await response.json(), peers: [] })
    } catch {
      renderFailure()
    }
  }
}

refresh()
setInterval(refresh, 5000)
