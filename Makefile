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
# behind.
node_modules/.installed: package.json bun.lock
	bun install --frozen-lockfile
	touch $@

# Verify the PATH plugins match the versions the SDKs in node_modules ask for.
plugins: node_modules/.installed
	nix develop -c check-pulumi-plugins

.PHONY: up preview build update check format fmt install plugins
