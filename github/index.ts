import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "pulumi-components";
import "./repositories";
import { addMainRuleset } from "./repositories/ruleset";
import { addWayfinderLabels } from "./repositories/wayfinder";

const adventOfCode = new gh.Repository(
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
	requiredChecks: [],
});

new PublicRepo("lang", {
	description: "A programming language",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

const mangoMtg = new gh.Repository(
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
	requiredChecks: [],
	pages: { buildType: "workflow" },
});

const palumiWorld = new gh.Repository(
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

const theCluster = new gh.Repository(
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

addWayfinderLabels("the-cluster", theCluster, {
	"wayfinder:map": "the-cluster:wayfinder:map",
});

addMainRuleset("advent-of-code", adventOfCode.name, { requiredChecks: [] });
addMainRuleset("mango-mtg", mangoMtg.name, { requiredChecks: [] });
addMainRuleset("palumi-world", palumiWorld.name, { requiredChecks: [] });

// This ruleset and github's below were made in the UI and adopted, so each
// keeps the import it was adopted with.
addMainRuleset(
	"the-cluster",
	theCluster.name,
	{ requiredChecks: [] },
	{ import: "the-cluster:6525623" },
);

// The github repository itself is not declared here, only its ruleset.
addMainRuleset(
	"github",
	"github",
	{
		requiredChecks: [
			{ context: "pulumi", integrationId: integrationIds.github },
		],
		rules: { creation: true },
	},
	{ import: "github:1054380" },
);
