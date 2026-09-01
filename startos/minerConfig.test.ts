import assert from 'node:assert/strict'
import test from 'node:test'
import { minerConfigDefaults, type MinerConfig } from './fileModels/minerConfig'
import {
  isPayoutAddressValid,
  normalizeStratum,
  validateMinerConfig,
} from './minerConfig'

const mainnetAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
const testnetAddress = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn'

function config(overrides: Partial<MinerConfig> = {}): MinerConfig {
  return {
    ...minerConfigDefaults,
    payoutAddress: testnetAddress,
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

test('rejects a preset from another network', () => {
  assert.deepEqual(validateMinerConfig(config({ poolSelection: 'lotto' })), {
    ok: false,
    issue: 'pool-network',
  })
})

test('returns normalized valid configuration and the resolved pool', () => {
  assert.deepEqual(
    validateMinerConfig(
      config({
        poolSelection: 'custom',
        customStratum: ' Pool.Example.COM:23111 ',
      }),
    ),
    {
      ok: true,
      pool: 'pool.example.com:23111',
      value: {
        ...config(),
        poolSelection: 'custom',
        customStratum: 'pool.example.com:23111',
      },
    },
  )
})

test('rejects worker and donation values outside package limits', () => {
  assert.deepEqual(validateMinerConfig(config({ cpuWorkers: 0 })), {
    ok: false,
    issue: 'cpu-workers',
  })
  assert.deepEqual(validateMinerConfig(config({ donationPercent: 1.9 })), {
    ok: false,
    issue: 'donation-percent',
  })
})
