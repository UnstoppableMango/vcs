import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "pulumi-components";
import "./repositories";

new gh.Repository(
	"advent-of-code",
	{
		name: "advent-of-code",
		allowAutoMerge: true,
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description: "Advent of Code solutions in various languages",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		squashMergeCommitTitle: "PR_TITLE",
		topics: ["advent-of-code"],
		visibility: "public",
	},
	{ protect: true },
);

new PublicRepo("everybody-codes", {
	description: "Everybody Codes solutions in various languages",
});

new PublicRepo("lang", {
	description: "A programming language",
	requiredChecks: [
		{
			context: "Build and Test",
			integrationId: integrationIds.github,
		},
	],
});

new gh.Repository(
	"mango-mtg",
	{
		name: "mango-mtg",
		description: "Digital Magic: The Gathering",
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

new PublicRepo("ouranosis", {
	description: "A game-ish kinda thing",
});

new gh.Repository(
	"palumi-world",
	{
		name: "palumi-world",
		description: "My Palworld install",
		hasIssues: true,
		hasProjects: true,
		hasWiki: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "enabled",
			},
			secretScanningPushProtection: {
				status: "enabled",
			},
		},
		visibility: "public",
	},
	{ protect: true },
);

new PublicRepo("renovate-config", {
	description: `UnstoppableMango's Renovate presets`,
	topics: ["renovate", "cicd", "bun"],
	requiredChecks: [
		{ context: "Validate", integrationId: integrationIds.github },
	],
});

new gh.Repository(
	"the-cluster",
	{
		name: "the-cluster",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowRebaseMerge: false,
		allowSquashMerge: true,
		allowUpdateBranch: true,
		deleteBranchOnMerge: true,
		description: "Source for THECLUSTER",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		squashMergeCommitTitle: "PR_TITLE",
		visibility: "public",
		webCommitSignoffRequired: true,
	},
	{ protect: true },
);
