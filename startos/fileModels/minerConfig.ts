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

export const minerConfigDefaults = {
  network: 'testnet4' as const,
  payoutAddress: '',
  poolSelection: 'testnet4' as const,
  customStratum: '',
  cpuWorkers: 2,
  donationPercent: 2,
}

const shape = z.object({
  network: z.enum(networks).catch(minerConfigDefaults.network),
  payoutAddress: z.string().catch(minerConfigDefaults.payoutAddress),
  poolSelection: z
    .enum(poolSelections)
    .catch(minerConfigDefaults.poolSelection),
  customStratum: z.string().catch(minerConfigDefaults.customStratum),
  cpuWorkers: z
    .number()
    .int()
    .min(1)
    .max(256)
    .catch(minerConfigDefaults.cpuWorkers),
  donationPercent: z
    .number()
    .min(2)
    .max(100)
    .catch(minerConfigDefaults.donationPercent),
})

export type MinerConfig = z.infer<typeof shape>
export type MinerNetwork = MinerConfig['network']
export type PoolSelection = MinerConfig['poolSelection']

export const minerConfigJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './startos-config.json' },
  shape,
)
