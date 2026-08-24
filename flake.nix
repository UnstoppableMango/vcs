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
        in
        {
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
              ++ (with pkgs.pulumiPackages; [
                pulumi-bun
              ])
              ++ [
                # The plugin itself is not here: since v0.0.2 the SDK's
                # pluginDownloadURL resolves to a real GitHub release, so pulumi
                # downloads pulumi-resource-git on its own. Adding
                # `gitProvider.default` back would shadow that with an ambient
                # PATH plugin, which pulumi prefers over the download.
                vendorGitSdk
              ];

            shellHook = ''
              vendor-git-sdk
            '';
          };

          treefmt.programs = {
            nixfmt.enable = true;
          };
        };
    };
}
