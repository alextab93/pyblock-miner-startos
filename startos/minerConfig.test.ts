import assert from 'node:assert/strict'
import test from 'node:test'
import {
  minerConfigDefaults,
  minerProfileDefaults,
  normalizeMinerConfigInput,
  type MinerConfig,
  type MinerProfile,
} from './fileModels/minerConfig'
import {
  isPayoutAddressValid,
  normalizeStratum,
  validateMinerConfig,
} from './minerConfig'

const mainnetAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
const testnetAddress = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn'

function profile(overrides: Partial<MinerProfile> = {}): MinerProfile {
  return {
    ...minerProfileDefaults,
    payoutAddress: testnetAddress,
    ...overrides,
  }
}

function config(overrides: Partial<MinerConfig> = {}): MinerConfig {
  return {
    ...minerConfigDefaults,
    miners: [profile()],
    ...overrides,
  }
}

test('accepts addresses only on a compatible network', () => {
  assert.equal(isPayoutAddressValid('mainnet', mainnetAddress), true)
  assert.equal(isPayoutAddressValid('testnet4', mainnetAddress), false)
  assert.equal(isPayoutAddressValid('testnet4', testnetAddress), true)
  assert.equal(isPayoutAddressValid('regtest', testnetAddress), true)
})

test('normalizes valid raw Stratum endpoints', () => {
  assert.equal(
    normalizeStratum(' Pool.Example.COM:23111 '),
    'pool.example.com:23111',
  )
})

test('rejects URLs, shell fragments, and invalid ports as Stratums', () => {
  assert.equal(normalizeStratum('https://pool.example.com:443'), null)
  assert.equal(normalizeStratum('pool.example.com:0'), null)
  assert.equal(normalizeStratum('pool.example.com:65536'), null)
  assert.equal(normalizeStratum('pool.example.com:1234;id'), null)
})

test('migrates a single-miner configuration without changing its settings', () => {
  assert.deepEqual(
    normalizeMinerConfigInput({
      network: 'mainnet',
      payoutAddress: mainnetAddress,
      poolSelection: 'chirp',
      customStratum: '',
      cpuWorkers: 6,
      donationPercent: 2.5,
    }),
    {
      cpuBudget: 6,
      donationPercent: 2.5,
      miners: [
        {
          name: 'Miner 1',
          enabled: true,
          network: 'mainnet',
          payoutAddress: mainnetAddress,
          poolSelection: 'chirp',
          customStratum: '',
          cpuWorkers: 6,
        },
      ],
    },
  )
})

test('rejects a preset from another network and identifies its profile', () => {
  assert.deepEqual(
    validateMinerConfig(
      config({ miners: [profile({ name: 'Lotto', poolSelection: 'lotto' })] }),
    ),
    { ok: false, issue: 'pool-network', minerName: 'Lotto' },
  )
})

test('resolves independent pools and normalizes saved profile values', () => {
  const second = profile({
    name: 'Mainnet Chirp',
    network: 'mainnet',
    payoutAddress: mainnetAddress,
    poolSelection: 'custom',
    customStratum: ' Pool.Example.COM:5574 ',
    cpuWorkers: 3,
  })
  const input = config({
    cpuBudget: 5,
    donationPercent: 2.5,
    miners: [profile({ name: 'Testnet', cpuWorkers: 2 }), second],
  })
  assert.deepEqual(validateMinerConfig(input), {
    ok: true,
    value: {
      ...input,
      miners: [
        input.miners[0],
        { ...second, customStratum: 'pool.example.com:5574' },
      ],
    },
    miners: [
      { ...input.miners[0], pool: 'pool.pyblock.xyz:23111' },
      {
        ...second,
        customStratum: 'pool.example.com:5574',
        pool: 'pool.example.com:5574',
      },
    ],
  })
})

test('rejects duplicate names without regard to case', () => {
  assert.deepEqual(
    validateMinerConfig(
      config({
        cpuBudget: 4,
        miners: [
          profile({ name: 'Chirp', cpuWorkers: 2 }),
          profile({ name: 'chirp', cpuWorkers: 2 }),
        ],
      }),
    ),
    { ok: false, issue: 'duplicate-name', minerName: 'chirp' },
  )
})

test('requires an enabled miner within the shared CPU budget', () => {
  assert.deepEqual(
    validateMinerConfig(config({ miners: [profile({ enabled: false })] })),
    { ok: false, issue: 'no-enabled-miners' },
  )
  assert.deepEqual(
    validateMinerConfig(
      config({
        cpuBudget: 3,
        miners: [
          profile({ name: 'One', cpuWorkers: 2 }),
          profile({ name: 'Two', cpuWorkers: 2 }),
        ],
      }),
    ),
    { ok: false, issue: 'cpu-budget' },
  )
})

test('ignores disabled profiles when calculating the CPU budget', () => {
  assert.equal(
    validateMinerConfig(
      config({
        cpuBudget: 2,
        miners: [
          profile({ name: 'Active', cpuWorkers: 2 }),
          profile({ name: 'Stopped', enabled: false, cpuWorkers: 8 }),
        ],
      }),
    ).ok,
    true,
  )
})

test('rejects donation values outside package limits', () => {
  assert.deepEqual(validateMinerConfig(config({ donationPercent: 1.9 })), {
    ok: false,
    issue: 'donation-percent',
  })
})
