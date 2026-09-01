import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const networks = ['mainnet', 'testnet4', 'regtest'] as const
export const poolSelections = [
  'lotto',
  'chirp',
  'carousel',
  'testnet4',
  'regtest',
  'custom',
] as const

export const minerProfileDefaults = {
  name: 'Miner 1',
  enabled: true,
  network: 'testnet4' as const,
  payoutAddress: '',
  poolSelection: 'testnet4' as const,
  customStratum: '',
  cpuWorkers: 2,
}

export const minerConfigDefaults = {
  cpuBudget: 2,
  donationPercent: 2,
  miners: [{ ...minerProfileDefaults }],
}

const profileShape = z.object({
  name: z.string().catch(minerProfileDefaults.name),
  enabled: z.boolean().catch(minerProfileDefaults.enabled),
  network: z.enum(networks).catch(minerProfileDefaults.network),
  payoutAddress: z.string().catch(minerProfileDefaults.payoutAddress),
  poolSelection: z
    .enum(poolSelections)
    .catch(minerProfileDefaults.poolSelection),
  customStratum: z.string().catch(minerProfileDefaults.customStratum),
  cpuWorkers: z
    .number()
    .int()
    .min(1)
    .max(256)
    .catch(minerProfileDefaults.cpuWorkers),
})

const currentShape = z.object({
  cpuBudget: z
    .number()
    .int()
    .min(1)
    .max(256)
    .catch(minerConfigDefaults.cpuBudget),
  donationPercent: z
    .number()
    .min(2)
    .max(100)
    .catch(minerConfigDefaults.donationPercent),
  miners: z.array(profileShape).min(1).max(8).catch(minerConfigDefaults.miners),
})

export function normalizeMinerConfigInput(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const legacy = value as Record<string, unknown>
  if ('miners' in legacy || !('network' in legacy)) return value
  const cpuWorkers =
    typeof legacy.cpuWorkers === 'number'
      ? legacy.cpuWorkers
      : minerProfileDefaults.cpuWorkers
  return {
    cpuBudget: cpuWorkers,
    donationPercent:
      typeof legacy.donationPercent === 'number'
        ? legacy.donationPercent
        : minerConfigDefaults.donationPercent,
    miners: [
      {
        name: minerProfileDefaults.name,
        enabled: true,
        network: legacy.network,
        payoutAddress: legacy.payoutAddress,
        poolSelection: legacy.poolSelection,
        customStratum: legacy.customStratum,
        cpuWorkers,
      },
    ],
  }
}

const shape = z.preprocess(normalizeMinerConfigInput, currentShape)

export type MinerConfig = z.infer<typeof currentShape>
export type MinerProfile = MinerConfig['miners'][number]
export type MinerNetwork = MinerProfile['network']
export type PoolSelection = MinerProfile['poolSelection']

export const minerConfigJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './startos-config.json' },
  shape,
)
