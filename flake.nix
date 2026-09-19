{
  description = "A Nix flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    systems.url = "github:UnstoppableMango/nix-systems";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    pulumi-provider-git = {
      url = "github:UnstoppableMango/pulumi-provider-git";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-parts.follows = "flake-parts";
      inputs.systems.follows = "systems";
      inputs.treefmt-nix.follows = "treefmt-nix";
      inputs.pulumi2nix.inputs.flake-parts.follows = "flake-parts";
      inputs.pulumi2nix.inputs.systems.follows = "systems";
      inputs.pulumi2nix.inputs.treefmt-nix.follows = "treefmt-nix";
    };

    pulumipkgs = {
      url = "github:unmango/pulumipkgs";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-parts.follows = "flake-parts";
      inputs.systems.follows = "systems";
      inputs.treefmt-nix.follows = "treefmt-nix";
      inputs.pulumi2nix.inputs.flake-parts.follows = "flake-parts";
      inputs.pulumi2nix.inputs.systems.follows = "systems";
      inputs.pulumi2nix.inputs.treefmt-nix.follows = "treefmt-nix";
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

      imports = with inputs; [
        systems.flakeModule
        treefmt-nix.flakeModule
      ];

      perSystem =
        {
          inputs',
          pkgs,
          system,
          ...
        }:
        let
          gitProvider = inputs'.pulumi-provider-git.packages;

          vendorGitSdk = pkgs.writeShellApplication {
            name = "vendor-git-sdk";
            runtimeEnv.GIT_SDK_NODEJS = gitProvider.sdk-nodejs;
            text = builtins.readFile ./scripts/vendor-git-sdk.sh;
          };

          checkPulumiPlugins = pkgs.writeShellApplication {
            name = "check-pulumi-plugins";
            runtimeInputs = [ pkgs.jq ];
            runtimeEnv = {
              GITHUB_PLUGIN_VERSION = pkgs.pulumiPackages.github.version;
              GITLAB_PLUGIN_VERSION = pkgs.pulumiPackages.gitlab.version;
              GIT_PLUGIN_VERSION = gitProvider.default.version;
            };
            text = builtins.readFile ./scripts/check-pulumi-plugins.sh;
          };
        in
        {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ inputs.pulumipkgs.overlays.default ];
          };

          devShells.default = pkgs.mkShellNoCC {
            packages =
              (with pkgs; [
                azure-cli
                gh
                glab
                bun
                gnumake
                nixfmt
                pulumi
              ])
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
