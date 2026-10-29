import * as gh from "@pulumi/github";
import { integrationIds, PrivateRepo, PublicRepo } from "pulumi-components";
import * as repositories from "./repositories";
import * as archived from "./repositories/archived";
import {
	type AgentLabelOptions,
	addAgentLabels,
	type LabeledRepo,
} from "./repositories/labels";
import { addMainRuleset } from "./repositories/ruleset";

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

const everybodyCodes = new PublicRepo("everybody-codes", {
	description: "Everybody Codes solutions in various languages",
	requiredChecks: [],
});

const lang = new PublicRepo("lang", {
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

const ouranosis = new PublicRepo("ouranosis", {
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

const renovateConfig = new PublicRepo("renovate-config", {
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

// Every repository that isn't archived or a fork gets the agent labels. Each
// label is named for the repository's export, in kebab case, which matches the
// names the labels were first managed under. The modules export rulesets and
// forks too, which the loop skips.
const labeledRepos: Record<string, unknown> = {
	...repositories,
	adventOfCode,
	everybodyCodes,
	lang,
	mangoMtg,
	ouranosis,
	palumiWorld,
	renovateConfig,
	theCluster,
};

// Opt-outs, and the labels that were made by hand before this program managed
// them. The imports can go once they have run.
const labelOptions: Record<string, AgentLabelOptions> = {
	mangomu: {
		imports: {
			"wayfinder:map": "mangomu:wayfinder:map",
			"wayfinder:research": "mangomu:wayfinder:research",
			"wayfinder:prototype": "mangomu:wayfinder:prototype",
			"wayfinder:grilling": "mangomu:wayfinder:grilling",
			"wayfinder:task": "mangomu:wayfinder:task",
		},
	},
	proxmoxClient: {
		imports: { "ready-for-human": "proxmox-client:ready-for-human" },
	},
	pulumi2crd: {
		imports: {
			"ready-for-agent": "pulumi2crd:ready-for-agent",
			"ready-for-human": "pulumi2crd:ready-for-human",
		},
	},
	pulumi2nix: {
		imports: {
			"needs-triage": "pulumi2nix:needs-triage",
			"ready-for-agent": "pulumi2nix:ready-for-agent",
		},
	},
	tdl: {
		imports: { "wayfinder:map": "tdl:wayfinder:map" },
	},
	terraformProviderPfSense: {
		imports: {
			"ready-for-agent": "terraform-provider-pfsense:ready-for-agent",
		},
	},
	theCluster: {
		imports: {
			"ready-for-agent": "the-cluster:ready-for-agent",
			"wayfinder:map": "the-cluster:wayfinder:map",
		},
	},
};

const isLabeledRepo = (x: unknown): x is LabeledRepo =>
	x instanceof PublicRepo ||
	x instanceof PrivateRepo ||
	x instanceof gh.Repository;
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

for (const [key, repo] of Object.entries(labeledRepos)) {
	if (key in archived) continue;
	if (!isLabeledRepo(repo)) continue;
	addAgentLabels(kebab(key), repo, labelOptions[key]);
}
