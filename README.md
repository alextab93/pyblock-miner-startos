# pyblockMiner

## About

pyblockMiner is a headless CPU mining service for BLAKE2b work served by compatible Stratum pools. The StartOS package supervises the miner, stores its configuration, limits its CPU worker count, and lowers its scheduler priority.

The payout address remains under the user’s control. This package does not create a wallet, generate a private key, store a WIF, or hold mining rewards.

## Features

- CPU-only mining on x86_64 and aarch64
- Headless service operation without a terminal UI
- Presets for current PyBLOCK mainnet, testnet4, and regtest pools
- Custom raw `hostname:port` Stratum endpoints
- Network-aware payout address validation
- Configurable CPU workers with a conservative default of two
- Process niceness of 10
- Private read-only mining dashboard with live session metrics
- Adaptive H/s, kH/s, MH/s, and GH/s display
- Persistent StartOS configuration and whole-volume backups
- Process readiness and detailed upstream logs

## CPU Usage

CPU Workers controls the mining thread count. The default is two. If the configured value exceeds the CPUs visible to the service, pyblockMiner clamps the effective count to the available maximum and reports that adjustment in the logs.

Niceness reduces the process scheduler priority so other StartOS workloads receive preference. Niceness does not cap CPU use, so the worker setting remains the primary limit.

## Configuration

Run **Configure Miner** before starting the service. Choose a network, enter a payout address for that network, select a compatible pool or custom Stratum, set CPU workers, and confirm the upstream donation percentage.

The package passes every setting as a separate process argument. User input is never interpolated into a shell command.

## Networking

The package exposes a private StartOS HTTP interface for the read-only mining dashboard. The miner serves it on internal port `8080`; StartOS controls the user-facing address. The package declares no service dependencies.

The miner makes outbound connections to:

- the configured primary Stratum endpoint;
- `pool.pyblock.xyz:4445` for the upstream mainnet donation session;
- `https://pool.pyblock.xyz:8443/api/blake_stats.php`;
- `https://pool.pyblock.xyz:8443/api/blake_stats_t4.php`;
- `https://pool.pyblock.xyz:8443/api/blake_balance.php`;
- `https://pool.pyblock.xyz:8443/api/blake_balance_t4.php`.

The balance request includes the configured payout address. A custom primary pool does not disable the separate donation session on mainnet.

## Persistence and Backups

The `main` volume stores `startos-config.json`, containing the network, payout address, pool selection, custom Stratum when used, CPU workers, and donation percentage. StartOS backups include the entire volume.

Backups do not contain a wallet private key because this package never generates or stores one. Back up the wallet controlling the payout address separately.

## Health Checks

Readiness requests the dashboard status endpoint and confirms that the supervised miner can return structured session data. It does not claim that a Stratum connection is active or that shares are being accepted. The dashboard distinguishes waiting, connected, mining, and paused states and shows recent miner events.

## Mining Dashboard

Open **Mining Dashboard** from the package interfaces to view current hashrate, CPU workers, session uptime, accepted and rejected shares, best share difficulty, blocks found, pool information, a short in-memory hashrate chart, and recent events.

The dashboard is read-only. It refreshes every five seconds and stores no history. Session counters and chart samples reset when the miner restarts. Use **Configure Miner** for settings.

## Limitations

- GPU and OpenCL mining are not included.
- There is no browser pause control or persistent metrics history.
- Pool availability and mining profitability are outside the package’s control.
- Real mining behavior depends on the selected network and upstream pool.

## BLAKE2b / Bitcoin Network Note

This miner works on BLAKE2b proof-of-work supplied by compatible PyBLOCK or custom Stratum networks. Conventional Bitcoin mainnet mining still uses SHA-256. The pinned upstream project states that its BLAKE2b change is not active on Bitcoin mainnet and that testnet4 and regtest coins have no monetary value.

On mainnet, upstream pyblockMiner enforces a minimum 2 percent hashrate donation. It opens a separate session to `pool.pyblock.xyz:4445` using the hard-coded donation address `1PyBLoCKdiaC46vD9CWcmxa3ey2VzSc5Q2`. This behavior belongs to upstream pyblockMiner and is not a StartOS fee.

Verify the current upstream network status before enabling mining.

## Upstream

- [pyblockMiner source](https://github.com/GaltRanch/pyblock-miner)
- [StartOS package source](https://github.com/alextab93/pyblock-miner-startos)
