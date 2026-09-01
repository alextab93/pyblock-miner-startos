# Updating pyblockMiner

The package currently pins upstream commit `33a7d742610f580a54c9ae36dc8638de6857fbea` from `GaltRanch/pyblock-miner`. The upstream tree has no release tag or committed `Cargo.lock` at this pin. The package therefore carries a generated lockfile and `patches/0001-add-cpu-threads.patch` for StartOS worker controls, adaptive headless rates, and the embedded dashboard status server.

The CPU worker setting is intentionally a command-line override. The package does not modify or depend on upstream `config.json` persistence.

1. Fetch upstream branches and tags.
2. Review recent commits and choose an exact source commit.
3. Update the `upstream-project` submodule to that commit.
4. Confirm the upstream version and MIT license.
5. Inspect CLI flags, config fields, headless output, signal behavior, pool endpoints, network mappings, balance and stats endpoints, donation rules, and CPU worker logic.
6. Rebase or remove the package patch. Run `git apply --check` against the new pin and fail the build when it does not apply. Recheck the dashboard status fields and embedded asset paths.
7. Regenerate `Cargo.lock` from the pinned source and review dependency changes.
8. Run `cargo test --locked` with the patch applied.
9. Update Docker base image tags and immutable index digests when necessary.
10. Update the package `VersionInfo` using `<upstream-version>:<package-revision>` and translate release notes.
11. Recheck every user-facing string in all five locales.
12. Recheck the README and instructions against the actual network and donation behavior.
13. Build x86_64 and aarch64 from a clean checkout.
14. Test a clean install, configuration gate, dashboard interface, status refresh, readiness, logs, CPU use, stop behavior, restart, backup and restore, uninstall and reinstall, and upgrade when a previous package exists.
15. Complete the current Start9 pre-publish checklist before tagging or publishing.

When upstream includes an equivalent tested `--cpu-threads` option, remove the package patch and its build application in the same change.
