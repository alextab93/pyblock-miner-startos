import { address, networks } from 'bitcoinjs-lib'
import {
  type MinerConfig,
  type MinerNetwork,
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
  | 'payout-address'
  | 'pool-network'
  | 'custom-stratum'
  | 'cpu-workers'
  | 'donation-percent'

export type ConfigValidation =
  | { ok: true; value: MinerConfig; pool: string }
  | { ok: false; issue: ConfigIssue }

const hostnamePattern =
  /^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/

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

export function validateMinerConfig(config: MinerConfig): ConfigValidation {
  const payoutAddress = config.payoutAddress.trim()
  if (!isPayoutAddressValid(config.network, payoutAddress)) {
    return { ok: false, issue: 'payout-address' }
  }

  let pool: string
  let customStratum = config.customStratum.trim()
  if (config.poolSelection === 'custom') {
    const normalized = normalizeStratum(customStratum)
    if (!normalized) return { ok: false, issue: 'custom-stratum' }
    pool = normalized
    customStratum = normalized
  } else {
    const preset = poolPresets[config.poolSelection]
    if (preset.network !== config.network) {
      return { ok: false, issue: 'pool-network' }
    }
    pool = preset.endpoint
    customStratum = ''
  }

  if (
    !Number.isInteger(config.cpuWorkers) ||
    config.cpuWorkers < 1 ||
    config.cpuWorkers > 256
  ) {
    return { ok: false, issue: 'cpu-workers' }
  }

  if (
    !Number.isFinite(config.donationPercent) ||
    config.donationPercent < 2 ||
    config.donationPercent > 100
  ) {
    return { ok: false, issue: 'donation-percent' }
  }

  return {
    ok: true,
    pool,
    value: {
      ...config,
      payoutAddress,
      customStratum,
    },
  }
}

export function presetSupportsNetwork(
  selection: PoolSelection,
  network: MinerNetwork,
): boolean {
  return selection === 'custom' || poolPresets[selection].network === network
}
