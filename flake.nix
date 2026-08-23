{
  description = "A Nix flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    systems.url = "github:nix-systems/triplet";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    # Deliberately not following our nixpkgs: the provider pins vendorHash,
    # npmDepsHash and nix/dotnet-deps.json against its own.
    pulumi-provider-git.url = "github:UnstoppableMango/pulumi-provider-git";

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
          # placed into node_modules by hand. The bundled node_modules is
          # dropped: it carries a second @pulumi/pulumi, and two copies of the
          # Pulumi runtime in one process don't share its module-level state.
          vendorGitSdk = pkgs.writeShellScriptBin "vendor-git-sdk" ''
            set -euo pipefail
            rm -rf node_modules/@unmango/pulumi-git
            mkdir -p node_modules/@unmango
            cp -rL --no-preserve=mode,ownership \
              ${gitProvider.sdk-nodejs}/lib/node_modules/@unmango/pulumi-git \
              node_modules/@unmango/pulumi-git
            rm -rf node_modules/@unmango/pulumi-git/node_modules
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
                # pulumi-resource-git on PATH: pulumi prefers an ambient plugin
                # over the download its pluginDownloadURL points at, which is a
                # release the provider repo doesn't have.
                gitProvider.default
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
