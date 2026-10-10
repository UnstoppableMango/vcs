import * as gh from "@pulumi/github";
import * as pulumi from "@pulumi/pulumi";
import { integrationIds, PrivateRepo, PublicRepo } from "pulumi-components";

export const me = new PrivateRepo("erik", { description: "me" });

export const zettelkasten = new PrivateRepo("zettelkasten", {
	description: "Notes captured with unmango/slip",
});

export const dotfiles = new gh.Repository(
	"dotfiles",
	{
		name: "dotfiles",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowRebaseMerge: false,
		allowSquashMerge: true,
		deleteBranchOnMerge: true,
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

new gh.RepositoryVulnerabilityAlerts(
	"dotfiles",
	{
		repository: dotfiles.name,
	},
	{ parent: dotfiles },
);

export const hosts = new PublicRepo("hosts", {
	description: "My on-prem server infrastructure",
	requiredChecks: [],
	// This was jank from the beginning, need to decide on a better way
	// requiredChecks: gh.getRepositoryFileOutput({
	// 	file: 'hosts.txt',
	// 	repository: 'UnstoppableMango/hosts',
	// }).apply(file => {
	// 	return file.content.trim().split('\n')
	// 		.filter(x => !['apollo', 'pik8s0a'].includes(x))
	// 		.map(x => ({
	// 			context: `pulumi (${x})`,
	// 			integrationId: integrationIds.github,
	// 		}));
	// }),
});

export const iam = new PrivateRepo("iam", {
	description: "Identity and access management as code",
});

const config = new pulumi.Config();

// control-plane's iamClientId output, copied by hand until control-plane
// state is on this backend and a StackReference can read it.
const iamAzureVariables = {
	AZURE_CLIENT_ID: config.require("iamAzureClientId"),
	AZURE_TENANT_ID: config.require("azureTenantId"),
	AZURE_SUBSCRIPTION_ID: config.require("azureSubscriptionId"),
};

for (const [variableName, value] of Object.entries(iamAzureVariables)) {
	new gh.ActionsVariable(
		`iam-${variableName}`,
		{ repository: iam.repo.name, variableName, value },
		{ parent: iam },
	);
}

export const nixos = new PublicRepo("nixos", {
	description: "My NixOS source",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const pki = new PrivateRepo(
	"pki",
	{
		description: "My private key infrastructure",
	},
	{ protect: true },
);

export const resume = new PublicRepo(
	"resume",
	{
		description: "My résumé, codified",
		requiredChecks: [
			{ context: "build", integrationId: integrationIds.github },
		],
	},
	{ aliases: [{ type: "unmango:github:PrivateRepo" }] },
);

export const unstoppablemango_io = new gh.Repository(
	"unstoppablemango.io",
	{
		name: "unstoppablemango.io",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowRebaseMerge: false,
		deleteBranchOnMerge: true,
		description: "A website about me for random garbage",
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

export const relationships = new PrivateRepo("relationships", {
	description: "Relationships mesh",
});

export const travel = new PublicRepo("travel", {
	description: "My adventures wandering the world",
	requiredChecks: [{ context: "check", integrationId: integrationIds.github }],
});
