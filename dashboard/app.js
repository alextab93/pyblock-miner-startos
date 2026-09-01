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
    "difficulty",
    "pool-miners",
    "pool-hashrate",
    "address",
    "workers",
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
  ].map((id) => [id, document.getElementById(id)]),
)

let chartValues = []
let chartPoints = []
let selectedChartIndex = -1

function formatHashrate(hashesPerSecond) {
  const value = Math.max(0, Number(hashesPerSecond) || 0)
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} GH/s`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MH/s`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)} kH/s`
  if (value > 0) return `${value.toFixed(2)} H/s`
  return "0 H/s"
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
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : fallback
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

function renderWorkers(workers) {
  elements.workers.replaceChildren()
  if (!Array.isArray(workers) || workers.length === 0) {
    const empty = document.createElement("p")
    empty.className = "metric-detail"
    empty.textContent = "Workers are starting"
    elements.workers.append(empty)
    return
  }
  for (const worker of workers) {
    const row = document.createElement("div")
    row.className = "worker"
    const name = document.createElement("span")
    name.textContent = worker.name
    const rate = document.createElement("span")
    rate.textContent = formatHashrate(worker.hashrateHps)
    row.append(name, rate)
    elements.workers.append(row)
  }
}

function renderEvents(events) {
  elements.events.replaceChildren()
  const values = Array.isArray(events) && events.length ? events : ["No events yet"]
  for (const event of values) {
    const item = document.createElement("li")
    item.textContent = event
    elements.events.append(item)
  }
}

function render(status) {
  document.body.dataset.state = status.state
  elements["state-label"].textContent = status.stateLabel
  elements.hashrate.textContent = status.hashrate
  elements["worker-summary"].textContent = `${status.workerCount} ${
    status.workerCount === 1 ? "worker" : "workers"
  }`
  elements.uptime.textContent = formatDuration(status.uptimeSeconds)
  elements.network.textContent = status.network || "Unknown"
  elements.pool.textContent = status.pool || "Waiting for configuration"
  elements.pool.title = status.pool || ""
  elements.accepted.textContent = formatNumber(status.accepted, "0")
  elements.rejected.textContent = formatNumber(status.rejected, "0")
  elements["rejection-rate"].textContent = `${Number(status.rejectionRate || 0).toFixed(1)}% rejection rate`
  elements["best-share"].textContent = status.bestShare
  elements.blocks.textContent = formatNumber(status.blocks, "0")
  elements["pool-height"].textContent = status.poolHeight
    ? formatNumber(status.poolHeight)
    : "Unavailable"
  elements.difficulty.textContent = status.currentDifficulty
  elements["pool-miners"].textContent = status.poolMiners
    ? formatNumber(status.poolMiners)
    : "Unavailable"
  elements["pool-hashrate"].textContent = status.poolHashrate
  elements.address.textContent = status.payoutAddress || "Unavailable"
  elements.address.title = status.payoutAddress || ""
  renderWorkers(status.workers)
  renderEvents(status.events)
  drawChart(status.hashrateHistoryHps)
  elements.updated.textContent = `Updated ${new Date().toLocaleTimeString()}`
}

function renderFailure() {
  document.body.dataset.state = "error"
  elements["state-label"].textContent = "Status unavailable"
  elements.updated.textContent = "Update failed, retrying"
}

async function refresh() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" })
    if (!response.ok) throw new Error(`Status request failed: ${response.status}`)
    render(await response.json())
  } catch {
    renderFailure()
  }
}

refresh()
setInterval(refresh, 5000)
