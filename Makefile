ARCHES := x86 arm
include node_modules/@start9labs/start-sdk/s9pk.mk

$(BASE_NAME)_x86_64.s9pk $(BASE_NAME)_aarch64.s9pk: $(wildcard patches/*.patch) $(shell find dashboard -type f)
