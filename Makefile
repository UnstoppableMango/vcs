up: node_modules/.installed
	pulumi up

preview: node_modules/.installed
	pulumi preview

build:
	nix build .#

update:
	nix flake update

check:
	nix flake check

format fmt:
	nix fmt

install: node_modules/.installed

# Reinstall whenever a lockfile moves, so a pull can't leave stale packages
# behind. The git SDK is pinned by the flake, and `bun install` prunes it, so
# re-place it after.
node_modules/.installed: package.json bun.lock flake.nix flake.lock
	bun install --frozen-lockfile
	nix develop -c vendor-git-sdk
	touch $@

# Re-place the git provider's Node SDK into node_modules. `bun install` can
# prune it, since it isn't a package.json dependency.
sdk:
	nix develop -c vendor-git-sdk

# Verify the PATH plugins match the versions the SDKs in node_modules ask for.
plugins: node_modules/.installed
	nix develop -c check-pulumi-plugins

.PHONY: up preview build update check format fmt install sdk plugins
