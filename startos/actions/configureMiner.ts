import { minerConfigDefaults, minerConfigJson } from '../fileModels/minerConfig'
import { i18n } from '../i18n'
import { type ConfigIssue, validateMinerConfig } from '../minerConfig'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  network: Value.select({
    name: i18n('Network'),
    description: i18n(
      'The network must match both the payout address and the selected Stratum pool.',
    ),
    default: minerConfigDefaults.network,
    values: {
      mainnet: i18n('Mainnet'),
      testnet4: i18n('Testnet4'),
      regtest: i18n('Regtest'),
    },
  }),
  payoutAddress: Value.text({
    name: i18n('Payout Address'),
    description: i18n(
      'A Bitcoin address you control for the selected network. This package never stores its private key.',
    ),
    required: true,
    default: null,
    placeholder: 'tb1q...',
  }),
  poolSelection: Value.select({
    name: i18n('Pool'),
    description: i18n(
      'Choose a preset compatible with the selected network or provide a custom raw host and port.',
    ),
    default: minerConfigDefaults.poolSelection,
    values: {
      lotto: i18n('PyBLOCK LOTTO'),
      chirp: i18n('PyBLOCK CHIRP'),
      carousel: i18n('PyBLOCK CAROUSEL'),
      testnet4: i18n('PyBLOCK testnet4'),
      regtest: i18n('PyBLOCK regtest'),
      custom: i18n('Custom'),
    },
  }),
  customStratum: Value.text({
    name: i18n('Custom Stratum'),
    description: i18n(
      'Required only when Custom is selected. Enter hostname:port without a URL scheme.',
    ),
    required: false,
    default: null,
    placeholder: 'pool.example.com:3333',
  }),
  cpuWorkers: Value.number({
    name: i18n('CPU Workers'),
    description: i18n(
      'Number of CPU mining threads. Values above visible CPUs are clamped by the miner.',
    ),
    required: true,
    default: minerConfigDefaults.cpuWorkers,
    integer: true,
    min: 1,
    max: 256,
    step: 1,
  }),
  donationPercent: Value.number({
    name: i18n('Donation (%)'),
    description: i18n(
      'Upstream pyblockMiner donates this percentage of mainnet hashrate through a separate PyBLOCK Stratum session. It is not a StartOS fee.',
    ),
    required: true,
    default: minerConfigDefaults.donationPercent,
    integer: false,
    min: 2,
    max: 100,
    step: 0.1,
  }),
})

const issueMessages: Record<ConfigIssue, string> = {
  'payout-address': i18n('Payout address is invalid for the selected network.'),
  'pool-network': i18n(
    'The selected pool does not support the selected network.',
  ),
  'custom-stratum': i18n(
    'Custom Stratum must be a valid hostname:port with a port from 1 to 65535.',
  ),
  'cpu-workers': i18n('CPU workers must be an integer from 1 to 256.'),
  'donation-percent': i18n('Donation must be between 2 and 100 percent.'),
}

export const configureMiner = sdk.Action.withInput(
  'configure-miner',
  {
    name: i18n('Configure Miner'),
    description: i18n(
      'Configure the mining network, payout address, Stratum pool, CPU workers, and upstream donation.',
    ),
    warning: i18n(
      'BLAKE2b is not active on Bitcoin mainnet. Testnet and regtest coins have no monetary value. Verify upstream network status before mining.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async () => {
    const config = (await minerConfigJson.read().once()) ?? minerConfigDefaults
    return {
      network: config.network,
      payoutAddress: config.payoutAddress || undefined,
      poolSelection: config.poolSelection,
      customStratum: config.customStratum || null,
      cpuWorkers: config.cpuWorkers,
      donationPercent: config.donationPercent,
    }
  },
  async ({ effects, input }) => {
    const validation = validateMinerConfig({
      network: input.network,
      payoutAddress: input.payoutAddress,
      poolSelection: input.poolSelection,
      customStratum: input.customStratum ?? '',
      cpuWorkers: input.cpuWorkers,
      donationPercent: input.donationPercent,
    })
    if (!validation.ok) throw new Error(issueMessages[validation.issue])
    await minerConfigJson.merge(effects, validation.value)
    return {
      version: '1',
      title: i18n('Configuration Saved'),
      message: i18n(
        'The miner configuration was saved. A running service restarts automatically to apply it.',
      ),
      result: null,
    }
  },
)
