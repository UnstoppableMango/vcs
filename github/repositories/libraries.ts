import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "../components";

export const cliwrapFsharp = new gh.Repository(
	"CliWrap.FSharp",
	{
		name: "CliWrap.FSharp",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowRebaseMerge: false,
		allowUpdateBranch: true,
		deleteBranchOnMerge: true,
		description: "Idiomatic F# support for CliWrap",
		topics: ["shell", "cli", "fsharp", "dotnet", "process"],
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		squashMergeCommitTitle: "COMMIT_OR_PR_TITLE",
		visibility: "public",
	},
	{ protect: true },
);

export const commandLineExtensions = new PublicRepo(
	"UnMango.Extensions.CommandLine",
	{
		description: "Micro-framework for CLI apps built on System.CommandLine",
		topics: ["dotnet", "cli", "commandline"],
		requiredChecks: [
			{ context: "Build and Test", integrationId: integrationIds.github },
		],
	},
);

export const dockerDotnetFsharp = new gh.Repository(
	"Docker.Dotnet.FSharp",
	{
		name: "Docker.Dotnet.FSharp",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowUpdateBranch: true,
		deleteBranchOnMerge: true,
		description: "Idiomatic F# support for Docker.DotNet",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "enabled",
			},
			secretScanningPushProtection: {
				status: "enabled",
			},
		},
		squashMergeCommitTitle: "PR_TITLE",
		visibility: "public",
	},
	{ protect: true },
);

export const dockerFsharp = new gh.Repository(
	"Docker.FSharp",
	{
		name: "Docker.FSharp",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowUpdateBranch: true,
		deleteBranchOnMerge: true,
		description: "Docker computation expression and client written in F#",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "enabled",
			},
			secretScanningPushProtection: {
				status: "enabled",
			},
		},
		squashMergeCommitTitle: "PR_TITLE",
		visibility: "public",
	},
	{ protect: true },
);

export const dotnetProxmoxClient = new gh.Repository(
	"dotnet-proxmox-client",
	{
		name: "dotnet-proxmox-client",
		allowAutoMerge: true,
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description: ".NET client for the Proxmox REST API",
		hasIssues: true,
		hasWiki: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		visibility: "public",
	},
	{ protect: true },
);

new gh.RepositoryVulnerabilityAlerts(
	"dotnet-proxmox-client",
	{
		repository: dotnetProxmoxClient.name,
	},
	{ parent: dotnetProxmoxClient },
);

export const godec = new PublicRepo("godec", {
	description: 'Yet another codec library for Go named "godec"',
	topics: ["go", "codec", "encode", "decode", "serialization"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const ihfs = new PublicRepo("ihfs", {
	description: "I ❤️ FileSystems!",
	topics: ["go", "filesystem", "fs", "afero"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const nix = new PublicRepo("nix", {
	description: "Random Nix crap",
	topics: ["nix", "linux", "flake", "module"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const proxmoxClient = new gh.Repository(
	"proxmox-client",
	{
		name: "proxmox-client",
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description: "Proxmox client libraries generated via OpenAPI Generator",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		visibility: "public",
	},
	{ protect: true },
);
