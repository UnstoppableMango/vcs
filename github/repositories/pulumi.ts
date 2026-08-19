import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "../components";

export const vcs = new PublicRepo("vcs", {
	description: "Version control infrastructure as code",
	topics: ["iac", "vcs", "github", "gitlab", "git", "pulumi"],
	requiredChecks: [
		{ context: "check", integrationId: integrationIds.github },
		{ context: "pulumi", integrationId: integrationIds.github },
	],
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
