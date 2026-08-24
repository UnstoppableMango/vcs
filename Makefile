build:
	nix build .#

update:
	nix flake update

check lint:
	nix flake check

format fmt:
	nix fmt

# Re-place the git provider's Node SDK into node_modules. `bun install` can
# prune it, since it isn't a package.json dependency.
sdk:
	nix develop -c vendor-git-sdk
