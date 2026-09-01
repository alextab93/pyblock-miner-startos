import {
  minerConfigDefaults,
  minerConfigJson,
  minerProfileDefaults,
} from '../fileModels/minerConfig'
import { i18n } from '../i18n'
import { type ConfigIssue, validateMinerConfig } from '../minerConfig'
import { sdk } from '../sdk'

const { InputSpec, List, Value } = sdk

const minerSpec = InputSpec.of({
  name: Value.text({
    name: i18n('Miner Name'),
    description: i18n(
      'A unique label shown in service health and the mining dashboard.',
    ),
    required: true,
    default: minerProfileDefaults.name,
    minLength: 1,
    maxLength: 32,
  }),
  enabled: Value.toggle({
    name: i18n('Enabled'),
    description: i18n('Start this miner when the service is running.'),
    default: minerProfileDefaults.enabled,
  }),
  network: Value.select({
    name: i18n('Network'),
    description: i18n(
      'The network must match both the payout address and the selected Stratum pool.',
    ),
    default: minerProfileDefaults.network,
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
    default: minerProfileDefaults.poolSelection,
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
    description: i18n('CPU mining threads allocated to this miner.'),
    required: true,
    default: minerProfileDefaults.cpuWorkers,
    integer: true,
    min: 1,
    max: 256,
    step: 1,
  }),
})

const inputSpec = InputSpec.of({
  cpuBudget: Value.number({
    name: i18n('Total CPU Worker Budget'),
    description: i18n(
      'The sum of CPU workers for enabled miners cannot exceed this shared limit. Values above visible CPUs are clamped by the miner processes.',
    ),
    required: true,
    default: minerConfigDefaults.cpuBudget,
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
  miners: Value.list(
    List.obj(
      {
        name: i18n('Miners'),
        description: i18n(
          'Configure up to eight independent miners, each with its own pool, payout address, network, and CPU worker allocation.',
        ),
        minLength: 1,
        maxLength: 8,
      },
      { spec: minerSpec, displayAs: 'name', uniqueBy: 'name' },
    ),
  ),
})

const issueMessages: Record<ConfigIssue, string> = {
  'miner-name': i18n(
    'Miner names must start with a letter or number and contain only letters, numbers, spaces, underscores, or hyphens.',
  ),
  'duplicate-name': i18n('Miner names must be unique.'),
  'no-enabled-miners': i18n('At least one miner must be enabled.'),
  'payout-address': i18n('Payout address is invalid for the selected network.'),
  'pool-network': i18n(
    'The selected pool does not support the selected network.',
  ),
  'custom-stratum': i18n(
    'Custom Stratum must be a valid hostname:port with a port from 1 to 65535.',
  ),
  'cpu-workers': i18n('CPU workers must be an integer from 1 to 256.'),
  'cpu-budget': i18n(
    'The total workers assigned to enabled miners must not exceed the CPU worker budget.',
  ),
  'donation-percent': i18n('Donation must be between 2 and 100 percent.'),
}

export const configureMiner = sdk.Action.withInput(
  'configure-miner',
  {
    name: i18n('Configure Miners'),
    description: i18n(
      'Configure independent mining profiles, their CPU allocations, and the upstream donation.',
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
      cpuBudget: config.cpuBudget,
      donationPercent: config.donationPercent,
      miners: config.miners.map((miner) => ({
        ...miner,
        payoutAddress: miner.payoutAddress || undefined,
        customStratum: miner.customStratum || null,
      })),
    }
  },
  async ({ effects, input }) => {
    const validation = validateMinerConfig({
      cpuBudget: input.cpuBudget,
      donationPercent: input.donationPercent,
      miners: input.miners.map((miner) => ({
        ...miner,
        customStratum: miner.customStratum ?? '',
      })),
    })
    if (!validation.ok) {
      const prefix = validation.minerName ? `${validation.minerName}: ` : ''
      throw new Error(`${prefix}${issueMessages[validation.issue]}`)
    }
    await minerConfigJson.write(effects, validation.value)
    return {
      version: '1',
      title: i18n('Configuration Saved'),
      message: i18n(
        'The miner configurations were saved. Running miners restart automatically when their settings change.',
      ),
      result: null,
    }
  },
)
