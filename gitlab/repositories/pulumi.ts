import * as gitlab from "@pulumi/gitlab";
import { projectIn } from "../util";
import { pulumiGroup } from "../groups";

// This repo.
export const vcs = projectIn(pulumiGroup, "vcs", {
	description: "Version control infrastructure as code",
	// `ref` keeps main's subject distinct from MR source branches, which is what
	// control-plane's gitlabVcsFederation (exact match on ref:main) and
	// gitlabVcsFederationMr (wildcard on ref:*) each match against. `ref_type` is
	// only ever `branch` or `tag`, so it can't stand in for the branch itself.
	ciIdTokenSubClaimComponents: ["project_path", "ref_type", "ref"],
});

// Identifiers for the federated Azure login `pulumi:preview`/`pulumi:deploy`
// run in .gitlab-ci.yml. Not secrets (mirrors the plain, non-secret repo
// variables the old GitHub Actions workflow used), but masked since they're
// opaque GUIDs. Unprotected so MR pipelines (running on non-protected refs)
// can still preview.
const azureIds: Record<string, string> = {
	AZURE_CLIENT_ID: "8348a4f0-73aa-4c38-8eb2-cfb3a8dd506c",
	AZURE_TENANT_ID: "cc1862e8-3663-4b04-afb6-da85f96a6111",
	AZURE_SUBSCRIPTION_ID: "331fb30f-0da7-4da5-8ec0-3b34c1747e42",
};

export const vcsAzureVariables = Object.entries(azureIds).map(
	([key, value]) =>
		new gitlab.ProjectVariable(`vcs-${key}`, {
			project: vcs.id,
			key,
			value,
			masked: true,
			protected: false,
		}, { parent: vcs }),
);

// export const pulumiCiMgmt = projectIn(pulumiGroup, "pulumi-ci-mgmt", {
// 	description: "CI automation for Pulumi providers based on pulumi/ci-mgmt",
// 	path: "ci-mgmt",
// });

// export const pulumiKubernetesTheHardWay = projectIn(pulumiGroup, "pulumi-kubernetes-the-hard-way", {
// 	description: "A Pulumi component provider that implements Kelsey Hightower's Kubernetes the Hard Way",
// 	path: "kubernetes-the-hard-way",
// });

// export const pulumiProxmox = projectIn(pulumiGroup, "pulumi-proxmox", {
// 	path: "proxmox",
// });

// export const pulumiComponents = projectIn(pulumiGroup, "pulumi-components", {
// 	description: "Reusable Pulumi component resources",
// });

// Looks superseded by this repo (vcs) — confirm before migrating.
// export const github = projectIn(pulumiGroup, "github", {
// 	description: "The parts of my GitHub I manage with IaC",
// });

// export const pulumiBun = projectIn(pulumiGroup, "pulumi-bun", {
// 	description: "Experimental Pulumi support for Bun",
// 	path: "bun",
// });
