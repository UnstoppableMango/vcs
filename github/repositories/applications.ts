import * as gh from "@pulumi/github";
import { integrationIds, PrivateRepo, PublicRepo } from "../components";

export const minecraftManager = new PublicRepo("minecraft-manager", {
	description:
		"Visual management tool for deploying Minecraft servers across various platforms",
	topics: [
		"minecraft",
		"kubernetes",
		"docker",
		"helm",
		"bun",
		"react",
		"tailwindcss",
	],
	requiredChecks: [
		{ context: "Build and Test", integrationId: integrationIds.github },
		{ context: "Build and Test API", integrationId: integrationIds.github },
		{ context: "Docker", integrationId: integrationIds.github },
		{ context: "Helm", integrationId: integrationIds.github },
	],
});

export const johnstonDems = new PrivateRepo("johnston-dems-mailer", {
	description: "Johnston Democrats mailing application",
});

export const slackerBot = new PublicRepo("slacker-bot", {
	description: "A Discord bot for the Slackers",
	topics: ["discord", "bot", "slackers"],
});

export const xmageDocker = new gh.Repository("xmage-docker", {
	name: "xmage-docker",
	hasIssues: true,
	hasWiki: false,
	allowAutoMerge: true,
	allowMergeCommit: false,
	allowRebaseMerge: false,
	allowSquashMerge: true,
	deleteBranchOnMerge: true,
	topics: [
		"xmage",
		"docker",
		"container",
		"magic",
		"mtg",
		"gaming",
		"self-hosted",
	],
	securityAndAnalysis: {
		secretScanning: {
			status: "disabled",
		},
		secretScanningPushProtection: {
			status: "disabled",
		},
	},
	visibility: "public",
});

export const xmageRuleset = new gh.RepositoryRuleset("xmage-docker", {
	name: "main",
	repository: xmageDocker.name,
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
		pullRequest: {
			dismissStaleReviewsOnPush: true,
		},
		nonFastForward: true,
		requiredLinearHistory: true,
		requiredSignatures: true,
		requiredStatusChecks: {
			requiredChecks: [
				{ context: "Build", integrationId: integrationIds.github },
			],
		},
	},
});
