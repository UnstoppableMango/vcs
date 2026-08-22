import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "../components";

export const devcontainers = new PublicRepo("devcontainers", {
	description: "Home-grown devcontainer images",
	topics: ["devcontainer", "docker", "container"],
	requiredChecks: [{ context: "Build", integrationId: integrationIds.github }],
});

export const edd = new PublicRepo("edd", {
	description: "Example driven development",
	topics: ["go", "utility", "tool", "examples", "spec", "bdd", "testing"],
	requiredChecks: [
		{ context: "Build and Test", integrationId: integrationIds.github },
		{ context: "Docker", integrationId: integrationIds.github },
	],
});

export const fenced = new PublicRepo("fenced", {
	description: "Parse code fences from anywhere",
	topics: ["go", "markdown", "md", "fence", "parser", "tool"],
	requiredChecks: [
		{ context: "Build and Test", integrationId: integrationIds.github },
		{ context: "Docker", integrationId: integrationIds.github },
	],
});

export const forkctl = new PublicRepo("forkctl", {
	description: "A tool for maintaining forked repositories",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const ideas = new PublicRepo("ideas", {
	description: "Raw brainstorming workspace",
	topics: ["idea", "brainstorm", "nix", "productivity", "markdown"],
	requiredChecks: [{ context: "check", integrationId: integrationIds.github }],
	pages: {
		buildType: "legacy",
		source: { branch: "main", path: "/" },
	},
});

export const gossamer2nix = new PublicRepo("gossamer2nix", {
	description: "Convert Gossamer projects to Nix derivations",
	topics: ["nix", "gossamer", "go", "rust", "fsharp"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const multiDownloaderNxDocker = new gh.Repository(
	"multi-downloader-nx-docker",
	{
		name: "multi-downloader-nx-docker",
		description: "Docker image for anidl/multi-downloader-nx",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		topics: [
			"anime",
			"crunchyroll",
			"docker",
			"downloader",
			"funimation",
			"utility",
		],
		visibility: "public",
	},
	{ protect: true },
);

export const palworldUtils = new PublicRepo("palworld-utils", {
	description: "Utilities for Palworld",
	topics: ["palworld", "go", "utility", "tool", "game"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const patchpad = new PublicRepo("patchpad", {
	description: "Temporary developer environments for creating patches",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const piaManualConnections = new PublicRepo("pia-manual-connections", {
	description: "Dockerized pia-foss/manual-connections scripts",
	requiredChecks: [
		{ context: "Build and Test", integrationId: integrationIds.github },
		{ context: "Docker", integrationId: integrationIds.github },
	],
});

export const pulumiBun = new PublicRepo("pulumi-bun", {
	description: "Experimental Pulumi support for Bun",
});

export const wireguardCni = new PublicRepo("wireguard-cni", {
	description: "Wireguard CNI plugin",
});
