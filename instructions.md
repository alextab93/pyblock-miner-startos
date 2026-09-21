# pyblockMiner

## Getting Started

1. Open **Actions**.
2. Run **Configure Miner**.
3. Choose the intended network.
4. Enter a payout address you control for that network.
5. Choose a compatible pool. For CHIRP-PRIME DATUM, enter your gateway's local Stratum `hostname:port`.
6. Start with one or two CPU workers.
7. Review the upstream donation setting and save.
8. Start the service.

## CPU Usage

CPU Workers limits the mining threads. The default is two. pyblockMiner clamps values above the CPUs visible to the service. The package also runs the miner with reduced scheduler priority so other StartOS services receive preference.

## Payout Address

StartOS stores only the public payout address. It does not create or hold the wallet private key. Use an address from a wallet you control and back up that wallet separately.

The address and pool must match the selected network. Mainnet, testnet4, and regtest addresses are not interchangeable.

## CHIRP-PRIME DATUM

Set up one DATUM gateway from the current [CHIRP instructions](https://b.pyblock.xyz:8443/chirp.php#datum) before configuring this miner. The gateway connects to PyBLOCK through DATUM and exposes a local Stratum listener on port `23334` by default.

Select **Mainnet** and **PyBLOCK CHIRP-PRIME DATUM**, then enter a gateway endpoint reachable from this StartOS server, for example `gateway.lan:23334`. Do not enter `b.pyblock.xyz:28917`, which is the gateway's upstream DATUM port and is not a miner Stratum endpoint.

The legacy `:5574` preset remains available during the migration window. Existing profiles keep using it until you reconfigure them.

## Donation

Upstream pyblockMiner applies the configured donation only on mainnet, with a minimum of 2 percent. It uses a separate connection to the PyBLOCK donation pool even when the primary pool is custom. This is upstream miner behavior, not a StartOS fee.

## Logs

Open **Mining Dashboard** to see live hashrate, workers, accepted and rejected shares, pool status, session history, and recent events. The dashboard is read-only and resets its session data when the miner restarts.

Accepted shares prove useful mining work but are not normally blocks. With the bundled pyblockMiner `v0.2.33`, Blocks Found increases only when a share also meets a trustworthy network target.

Readiness confirms that the dashboard status endpoint responds. Open **Logs** for complete connection details, errors, and worker-count clamping.

## Network Warning

BLAKE2b is not active on conventional Bitcoin mainnet. Testnet4 and regtest coins have no monetary value. Verify the current upstream network notes before mining.

## Documentation

See the [upstream pyblockMiner documentation](https://github.com/GaltRanch/pyblock-miner).
