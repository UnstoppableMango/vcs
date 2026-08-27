build:
	nix build .#

update:
	nix flake update

check:
	nix flake check

# `check` alone is hermetic and network-less. `glab ci lint` isn't: it calls
# GitLab's live CI Lint API, so it runs as an impure app instead of a flake
# check.
lint: check
	nix run .#glab-ci-lint

format fmt:
	nix fmt

# Re-place the git provider's Node SDK into node_modules. `bun install` can
# prune it, since it isn't a package.json dependency.
sdk:
	nix develop -c vendor-git-sdk

# Verify the PATH plugins match the versions the SDKs in node_modules ask for.
plugins:
	nix develop -c check-pulumi-plugins
