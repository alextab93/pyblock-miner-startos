import { address, networks } from 'bitcoinjs-lib'
import {
  type MinerConfig,
  type MinerNetwork,
  type MinerProfile,
  type PoolSelection,
} from './fileModels/minerConfig'

export const poolPresets = {
  lotto: { network: 'mainnet', endpoint: 'pool.pyblock.xyz:4445' },
  chirp: { network: 'mainnet', endpoint: 'pool.pyblock.xyz:5574' },
  carousel: { network: 'mainnet', endpoint: 'pool.pyblock.xyz:30110' },
  testnet4: { network: 'testnet4', endpoint: 'pool.pyblock.xyz:23111' },
  regtest: { network: 'regtest', endpoint: 'pool.pyblock.xyz:23110' },
} as const

export type ConfigIssue =
  | 'miner-name'
  | 'duplicate-name'
  | 'no-enabled-miners'
  | 'payout-address'
  | 'pool-network'
  | 'custom-stratum'
  | 'cpu-workers'
  | 'cpu-budget'
  | 'donation-percent'

export type ResolvedMiner = MinerProfile & { pool: string }

export type ConfigValidation =
  | { ok: true; value: MinerConfig; miners: ResolvedMiner[] }
  | { ok: false; issue: ConfigIssue; minerName?: string }

const hostnamePattern =
  /^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/
const minerNamePattern = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,31}$/

const bitcoinNetworks = {
  mainnet: networks.bitcoin,
  testnet4: networks.testnet,
  regtest: networks.regtest,
} as const

export function isPayoutAddressValid(
  network: MinerNetwork,
  value: string,
): boolean {
  const payoutAddress = value.trim()
  if (!payoutAddress) return false
  try {
    address.toOutputScript(payoutAddress, bitcoinNetworks[network])
    return true
  } catch {
    return false
  }
}

export function normalizeStratum(value: string): string | null {
  const stratum = value.trim()
  if (!stratum || stratum.includes('://')) return null
  const separator = stratum.lastIndexOf(':')
  if (separator <= 0 || stratum.indexOf(':') !== separator) return null
  const hostname = stratum.slice(0, separator).trim().toLowerCase()
  const portText = stratum.slice(separator + 1).trim()
  if (!hostnamePattern.test(hostname) || !/^\d+$/.test(portText)) return null
  const port = Number(portText)
  if (port < 1 || port > 65535) return null
  return `${hostname}:${port}`
}

function validateProfile(
  profile: MinerProfile,
): { ok: true; value: ResolvedMiner } | { ok: false; issue: ConfigIssue } {
  const name = profile.name.trim()
  if (!minerNamePattern.test(name)) return { ok: false, issue: 'miner-name' }

  const payoutAddress = profile.payoutAddress.trim()
  if (!isPayoutAddressValid(profile.network, payoutAddress)) {
    return { ok: false, issue: 'payout-address' }
  }

  let pool: string
  let customStratum = profile.customStratum.trim()
  if (profile.poolSelection === 'custom') {
    const normalized = normalizeStratum(customStratum)
    if (!normalized) return { ok: false, issue: 'custom-stratum' }
    pool = normalized
    customStratum = normalized
  } else {
    const preset = poolPresets[profile.poolSelection]
    if (preset.network !== profile.network) {
      return { ok: false, issue: 'pool-network' }
    }
    pool = preset.endpoint
    customStratum = ''
  }

  if (
    !Number.isInteger(profile.cpuWorkers) ||
    profile.cpuWorkers < 1 ||
    profile.cpuWorkers > 256
  ) {
    return { ok: false, issue: 'cpu-workers' }
  }

  return {
    ok: true,
    value: {
      ...profile,
      name,
      payoutAddress,
      customStratum,
      pool,
    },
  }
}

export function validateMinerConfig(config: MinerConfig): ConfigValidation {
  if (
    !Number.isInteger(config.cpuBudget) ||
    config.cpuBudget < 1 ||
    config.cpuBudget > 256
  ) {
    return { ok: false, issue: 'cpu-budget' }
  }
  if (
    !Number.isFinite(config.donationPercent) ||
    config.donationPercent < 2 ||
    config.donationPercent > 100
  ) {
    return { ok: false, issue: 'donation-percent' }
  }

  const miners: ResolvedMiner[] = []
  const normalizedNames = new Set<string>()
  for (const profile of config.miners) {
    const validation = validateProfile(profile)
    if (!validation.ok) {
      return {
        ok: false,
        issue: validation.issue,
        minerName: profile.name.trim() || 'Unnamed miner',
      }
    }
    const normalizedName = validation.value.name.toLowerCase()
    if (normalizedNames.has(normalizedName)) {
      return {
        ok: false,
        issue: 'duplicate-name',
        minerName: validation.value.name,
      }
    }
    normalizedNames.add(normalizedName)
    if (validation.value.enabled) miners.push(validation.value)
  }

  if (miners.length === 0) return { ok: false, issue: 'no-enabled-miners' }
  const allocatedWorkers = miners.reduce(
    (total, miner) => total + miner.cpuWorkers,
    0,
  )
  if (allocatedWorkers > config.cpuBudget) {
    return { ok: false, issue: 'cpu-budget' }
  }

  return {
    ok: true,
    miners,
    value: {
      cpuBudget: config.cpuBudget,
      donationPercent: config.donationPercent,
      miners: config.miners.map((profile) => {
        const resolved = validateProfile(profile)
        if (!resolved.ok) return profile
        const { pool, ...value } = resolved.value
        return value
      }),
    },
  }
}

export function presetSupportsNetwork(
  selection: PoolSelection,
  network: MinerNetwork,
): boolean {
  return selection === 'custom' || poolPresets[selection].network === network
}
