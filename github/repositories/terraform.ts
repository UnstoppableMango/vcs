import { integrationIds, PublicRepo } from "../components";

export const terraformProviderSmallImprovements = new PublicRepo(
	"terraform-provider-small-improvements",
	{
		description: "Terraform provider for Small Improvements",
		requiredChecks: [
			{ context: "build", integrationId: integrationIds.github },
		],
	},
);

export const terraformProviderPfSense = new PublicRepo(
	"terraform-provider-pfsense",
	{
		description: "Terraform provider for pfSense using pfrest",
		requiredChecks: [
			{ context: "build", integrationId: integrationIds.github },
		],
	},
);

export const terraformProviderGit = new PublicRepo("terraform-provider-git", {
	description:
		"Terraform provider for managing the desired state of git repositories",
	topics: ["terraform", "terraform-provider", "git", "golang"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});
