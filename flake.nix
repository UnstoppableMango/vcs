{
  description = "A Nix flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    systems.url = "github:nix-systems/triplet";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    pulumi-provider-git = {
      url = "github:UnstoppableMango/pulumi-provider-git";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # `github` and `gitlab` plugins, built with pulumi2nix and tracked against
    # the Pulumi registry. The `follows` keeps one nixpkgs in the closure:
    # pulumipkgs re-exports several nixpkgs packages by path from its own
    # `inputs.nixpkgs`, so an unfollowed input would drag in a second one.
    #
    # These builds substitute from https://unmango.cachix.org. That is not
    # declared as a `nixConfig` here, because nix ignores flake config unless
    # every invocation passes `--accept-flake-config` and warns each time it
    # does so. Add it to your own nix.conf instead:
    #   extra-substituters = https://unmango.cachix.org
    #   extra-trusted-public-keys = unmango.cachix.org-1:Psb+0nALJfIcYiZLc9JYri4FJGNnzM6goZX7iLErXCI=
    # CI gets it from cachix-action's `extraPullNames`.
    pulumipkgs = {
      url = "github:unmango/pulumipkgs";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;
      imports = [ inputs.treefmt-nix.flakeModule ];

      perSystem =
        { pkgs, system, ... }:
        let
          gitProvider = inputs.pulumi-provider-git.packages.${system};

          # `@unmango/pulumi-git` isn't published to npm, so the nix-built SDK is
          # placed into node_modules by hand. Copied, not symlinked: the SDK
          # declares @pulumi/pulumi as a dependency but doesn't ship it, and
          # node and bun both resolve from a symlink's realpath, so a symlinked
          # SDK would search upward from /nix/store and never find our copy.
          vendorGitSdk = pkgs.writeShellScriptBin "vendor-git-sdk" ''
            set -euo pipefail
            rm -rf node_modules/@unmango/pulumi-git
            mkdir -p node_modules/@unmango
            cp -rL --no-preserve=mode,ownership \
              ${gitProvider.sdk-nodejs}/lib/node_modules/@unmango/pulumi-git \
              node_modules/@unmango/pulumi-git
          '';

          # A plugin on PATH is version-blind: pulumi runs whichever binary it
          # finds and never checks it against the version the SDK asks for, so a
          # `bun.lock` bump that flake.lock hasn't followed would silently keep
          # running the old provider. Compare the two pins directly instead.
          #
          # The nix side is interpolated at build time, so this script is only
          # ever right about the shell it was built for.
          checkPulumiPlugins = pkgs.writeShellApplication {
            name = "check-pulumi-plugins";
            runtimeInputs = [ pkgs.jq ];
            text = ''
              status=0

              check() {
                local plugin=$1 dir=$2 pinned=$3 manifest sdk

                manifest="$dir/package.json"
                if [ ! -f "$manifest" ]; then
                  echo "$plugin: no SDK at $dir"
                  case "$plugin" in
                    git) echo "  the vendored copy is missing. Run \`vendor-git-sdk\`." ;;
                    *)   echo "  the dependency isn't installed. Run \`bun install\`." ;;
                  esac
                  status=1
                  return
                fi

                sdk=$(jq -r '.pulumi.version // .version' "$manifest")
                if [ "$sdk" != "$pinned" ]; then
                  echo "$plugin: SDK $sdk != PATH plugin $pinned"
                  case "$plugin" in
                    git) echo "  the vendored SDK is stale. Run \`vendor-git-sdk\`." ;;
                    *)   echo "  bun.lock moved but flake.lock did not. Run \`nix flake update pulumipkgs\`." ;;
                  esac
                  status=1
                fi
              }

              check github node_modules/@pulumi/github ${pkgs.pulumiPackages.github.version}
              check gitlab node_modules/@pulumi/gitlab ${pkgs.pulumiPackages.gitlab.version}
              check git node_modules/@unmango/pulumi-git ${gitProvider.default.version}

              exit "$status"
            '';
          };
        in
        {
          # pulumipkgs' overlay *replaces* `pulumiPackages` rather than adding
          # to it, so nixpkgs' own entries (pulumi-azure-native, its
          # pulumi-command, ...) are not reachable through this `pkgs`. The only
          # one used here is `pulumi-bun`, which pulumipkgs re-exports as the
          # very same derivation nixpkgs builds.
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ inputs.pulumipkgs.overlays.default ];
          };

          devShells.default = pkgs.mkShellNoCC {
            packages =
              with pkgs;
              [
                glab
                bun
                gnumake
                nixfmt
                pulumi
              ]
              # Every resource plugin this stack needs, pinned by flake.lock and
              # found on PATH. Pulumi prefers an ambient plugin over both its
              # pluginDownloadURL and ~/.pulumi/plugins, so nothing is
              # downloaded at run time; the `using ... from $PATH` warnings it
              # logs for each one are the mechanism working, not a problem.
              ++ (with pkgs.pulumiPackages; [
                pulumi-bun
                github
                gitlab
              ])
              ++ [
                gitProvider.default
                checkPulumiPlugins
                vendorGitSdk
              ];

            shellHook = ''
              vendor-git-sdk
              check-pulumi-plugins || true
            '';
          };

          treefmt.programs = {
            nixfmt.enable = true;
          };
        };
    };
}
