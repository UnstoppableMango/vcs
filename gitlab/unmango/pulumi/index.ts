import { projectIn } from "../../util";
import { pulumiGroup } from "./group";

export { pulumiGroup };

// Converters keep their GitHub name as the Pulumi resource name so state and
// `pulumi import` line up with the mirror. On GitLab the input format is the
// group, leaving `2<target>` as the project.

export const pulumi2crd = projectIn(pulumiGroup, "pulumi2crd", {
	name: "2crd",
	description:
		"Converts Pulumi package specs to Custom Resource Definitions (CRDs)",
});

export const pulumi2nix = projectIn(pulumiGroup, "pulumi2nix", {
	name: "2nix",
	description: "Generate Nix expressions from Pulumi projects",
});

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

// Looks superseded by this repo (github.com/UnstoppableMango/vcs).
// Confirm before migrating.
// export const github = projectIn(pulumiGroup, "github", {
// 	description: "The parts of my GitHub I manage with IaC",
// });

// export const pulumiBun = projectIn(pulumiGroup, "pulumi-bun", {
// 	description: "Experimental Pulumi support for Bun",
// 	path: "bun",
// });
