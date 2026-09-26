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
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
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

// This ruleset and github's below were made in the UI. They are adopted as
// they stand, so these rules restate what each already had.
new gh.RepositoryRuleset(
	"the-cluster",
	{
		name: "main",
		repository: theCluster.name,
		enforcement: "active",
		target: "branch",
		conditions: {
			refName: {
				includes: ["~DEFAULT_BRANCH"],
				excludes: [],
			},
		},
		rules: {
			deletion: true,
			nonFastForward: true,
			requiredLinearHistory: true,
			pullRequest: {
				allowedMergeMethods: ["squash"],
				dismissStaleReviewsOnPush: false,
				requireCodeOwnerReview: false,
				requireLastPushApproval: false,
				requiredApprovingReviewCount: 0,
				requiredReviewThreadResolution: false,
			},
		},
	},
	{ import: "the-cluster:6525623" },
);

// The github repository itself is not declared here, only its ruleset.
new gh.RepositoryRuleset(
	"github",
	{
		name: "main",
		repository: "github",
		enforcement: "active",
		target: "branch",
		conditions: {
			refName: {
				includes: ["~DEFAULT_BRANCH"],
				excludes: [],
			},
		},
		rules: {
			creation: true,
			deletion: true,
			nonFastForward: true,
			requiredLinearHistory: true,
			requiredStatusChecks: {
				doNotEnforceOnCreate: false,
				strictRequiredStatusChecksPolicy: false,
				requiredChecks: [
					{ context: "pulumi", integrationId: integrationIds.github },
				],
			},
		},
	},
	{ import: "github:1054380" },
);
