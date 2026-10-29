import * as gh from "@pulumi/github";
import { integrationIds, PrivateRepo, PublicRepo } from "pulumi-components";
import { addMainRuleset } from "./ruleset";

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
	requiredChecks: [],
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

export const xmageRuleset = addMainRuleset("xmage-docker", xmageDocker.name, {
	requiredChecks: [{ context: "Build", integrationId: integrationIds.github }],
});

export const mangomu = new PublicRepo("mangomu", {
	description: "Cloud-native emulation from the ground up",
	topics: ["emulation", "emulator", "kubernetes", "webrtc", "nintendo-ds"],
	requiredChecks: [],
});
