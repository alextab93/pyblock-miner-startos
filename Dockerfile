FROM rust:1.89.0-bookworm@sha256:948f9b08a66e7fe01b03a98ef1c7568292e07ec2e4fe90d88c07bb14563c84ff AS builder

WORKDIR /src
COPY upstream-project/ ./
COPY Cargo.lock ./Cargo.lock
COPY dashboard/ ./dashboard/
COPY icon.svg ./dashboard/icon.svg
COPY patches/0001-add-cpu-threads.patch /tmp/0001-add-cpu-threads.patch
RUN git apply --check /tmp/0001-add-cpu-threads.patch && git apply /tmp/0001-add-cpu-threads.patch
RUN cargo test --locked --release
RUN cargo build --locked --release --bin pyblockMiner

FROM debian:bookworm-slim@sha256:88200866dfff7ea7f5cbcb6ec7c8a701889efe6fe859fe64d6990e4b07ea4171

COPY --from=builder /src/target/release/pyblockMiner /usr/local/bin/pyblockMiner
COPY docker/start-pyblock-miner /usr/local/bin/start-pyblock-miner
COPY docker/healthcheck /usr/local/bin/healthcheck
RUN chmod 755 /usr/local/bin/pyblockMiner /usr/local/bin/start-pyblock-miner /usr/local/bin/healthcheck

ENTRYPOINT ["/usr/local/bin/start-pyblock-miner"]
