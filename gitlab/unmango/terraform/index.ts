import { projectIn } from "../../util";
import { terraformGroup } from "./group";

export { terraformGroup };

// // Registry-locked name, do not shorten.
// export const terraformProviderGit = projectIn(terraformGroup, "terraform-provider-git", {
// 	description: "Terraform provider for managing the desired state of git repositories",
// });

// // Registry-locked name, do not shorten.
// export const terraformProviderPfsense = projectIn(terraformGroup, "terraform-provider-pfsense", {
// 	description: "Terraform provider for pfSense using pfrest",
// });

// // Registry-locked name, do not shorten.
// export const terraformProviderSmallImprovements = projectIn(terraformGroup, "terraform-provider-small-improvements", {
// 	description: "Terraform provider for Small Improvements",
// });

// Registry-locked name, do not shorten.
export const terraformProviderNetGear = projectIn(terraformGroup, "terraform-provider-netgear", {
    description: "Terraform provider for (some) NetGear devices",
});

// Converter. The group is the input format, so the project is the target.
export const terraform2crd = projectIn(terraformGroup, "terraform2crd", {
	name: "2crd",
	description:
		"Converts Terraform provider code specs to Custom Resource Definitions (CRDs)",
});
