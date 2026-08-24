import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "pulumi-components";

export const vcs = new PublicRepo("vcs", {
	description:
		"Version control infrastructure as code. Moved to gitlab.com/unmango/pulumi/vcs",
	topics: ["iac", "vcs", "github", "gitlab", "git", "pulumi"],
	requiredChecks: [
		{ context: "check", integrationId: integrationIds.github },
		{ context: "pulumi", integrationId: integrationIds.github },
	],
});

export const pulumiComponents = new PublicRepo("pulumi-components", {
	description: "Reusable Pulumi component resources",
	topics: ["pulumi", "iac", "components", "typescript"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const pulumi2nix = new PublicRepo("pulumi2nix", {
	description: "Generate Nix expressions from Pulumi projects",
	topics: ["pulumi", "nix", "tooling"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const pulumiCiMgmt = new gh.Repository(
	"pulumi-ci-mgmt",
	{
		name: "pulumi-ci-mgmt",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowUpdateBranch: true,
		deleteBranchOnMerge: true,
		description: "CI automation for Pulumi providers based on pulumi/ci-mgmt",
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

export const pulumiKubernetesTheHardWay = new gh.Repository(
	"pulumi-kubernetes-the-hard-way",
	{
		name: "pulumi-kubernetes-the-hard-way",
		allowAutoMerge: true,
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description:
			"A Pulumi component provider that implements Kelsey Hightower's Kubernetes the Hard Way",
		hasIssues: true,
		hasProjects: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		squashMergeCommitTitle: "PR_TITLE",
		template: {
			owner: "pulumi",
			repository: "pulumi-component-provider-go-boilerplate",
		},
		visibility: "public",
	},
	{ protect: true },
);

export const pulumiProxmox = new gh.Repository(
	"pulumi-proxmox",
	{
		name: "pulumi-proxmox",
		hasIssues: true,
		securityAndAnalysis: {
			secretScanning: {
				status: "disabled",
			},
			secretScanningPushProtection: {
				status: "disabled",
			},
		},
		template: {
			owner: "pulumi",
			repository: "pulumi-component-provider-ts-boilerplate",
		},
		visibility: "public",
	},
	{ protect: true },
);

export const pulumiProviderGit = new gh.Repository(
	"pulumi-provider-git",
	{
		name: "pulumi-provider-git",
		allowAutoMerge: true,
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description:
			"Pulumi provider for managing the desired state of git repositories, bridged from terraform-provider-git",
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
		template: {
			owner: "pulumi",
			repository: "pulumi-tf-provider-boilerplate",
		},
		visibility: "public",
	},
	{ protect: true },
);
