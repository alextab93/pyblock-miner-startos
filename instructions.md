# pyblockMiner

## Getting Started

1. Open **Actions**.
2. Run **Configure Miner**.
3. Choose the intended network.
4. Enter a payout address you control for that network.
5. Choose a compatible pool or enter a custom `hostname:port` Stratum.
6. Start with one or two CPU workers.
7. Review the upstream donation setting and save.
8. Start the service.

## CPU Usage

CPU Workers limits the mining threads. The default is two. pyblockMiner clamps values above the CPUs visible to the service. The package also runs the miner with reduced scheduler priority so other StartOS services receive preference.

## Payout Address

StartOS stores only the public payout address. It does not create or hold the wallet private key. Use an address from a wallet you control and back up that wallet separately.

The address and pool must match the selected network. Mainnet, testnet4, and regtest addresses are not interchangeable.

## Donation

Upstream pyblockMiner applies the configured donation only on mainnet, with a minimum of 2 percent. It uses a separate connection to the PyBLOCK donation pool even when the primary pool is custom. This is upstream miner behavior, not a StartOS fee.

## Logs

Open **Mining Dashboard** to see live hashrate, workers, accepted and rejected shares, pool status, session history, and recent events. The dashboard is read-only and resets its session data when the miner restarts.

Readiness confirms that the dashboard status endpoint responds. Open **Logs** for complete connection details, errors, and worker-count clamping.

## Network Warning

BLAKE2b is not active on conventional Bitcoin mainnet. Testnet4 and regtest coins have no monetary value. Verify the current upstream network notes before mining.

## Documentation

See the [upstream pyblockMiner documentation](https://github.com/GaltRanch/pyblock-miner).
