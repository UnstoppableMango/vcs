import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "pulumi-components";

export const a2b = new PublicRepo("a2b", {
	description: "Registry for converter utilities",
	topics: ["ux", "go", "dotnet", "nix", "codegen"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const openapi2go = new PublicRepo("openapi2go", {
	description: "Converts OpenAPI specifications to Go",
	topics: ["openapi", "ux", "codegen", "go", "ast"],
	requiredChecks: [
		{ context: "build", integrationId: integrationIds.github },
		{ context: "lint", integrationId: integrationIds.github },
		{ context: "docker", integrationId: integrationIds.github },
	],
});

export const openapi2terraform = new PublicRepo("openapi2terraform", {
	description: "Converts OpenAPI specifications to terraform providers",
	topics: ["terraform", "openapi", "ux", "codegen", "iac"],
	requiredChecks: [
		{ context: "build", integrationId: integrationIds.github },
		{ context: "lint", integrationId: integrationIds.github },
		{ context: "docker", integrationId: integrationIds.github },
	],
});

export const goProtocmd = new PublicRepo("go-protocmd", {
	description: "Go implementation of dev.unmango.cmd",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const pulumi2crd = new PublicRepo("pulumi2crd", {
	description:
		"Converts Pulumi package specs to Custom Resource Definitions (CRDs)",
	requiredChecks: [
		{ context: "build", integrationId: integrationIds.github },
		{ context: "lint", integrationId: integrationIds.github },
		{ context: "docker", integrationId: integrationIds.github },
	],
});

export const sql2csharp = new PublicRepo("sql2csharp", {
	description: "Converts SQL into a C# representation",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const tdl = new PublicRepo(
	"tdl",
	{
		description: "Type description language and codegen suite",
		// Each of these is a live setting the component's defaults would
		// otherwise change. licenseTemplate is unset because tdl is GPL-3.0
		// rather than the component's MIT.
		overrides: {
			allowRebaseMerge: true,
			allowUpdateBranch: true,
			hasProjects: true,
			licenseTemplate: undefined,
			squashMergeCommitTitle: "PR_TITLE",
			webCommitSignoffRequired: true,
			securityAndAnalysis: {
				secretScanning: {
					status: "enabled",
				},
				secretScanningPushProtection: {
					status: "enabled",
				},
			},
		},
		// A key given here replaces that rule outright, so pullRequest is
		// restated in full. Thread resolution is the gate tdl's AGENTS.md
		// documents: main takes no approving review, and does take a resolved
		// thread on every comment.
		rules: {
			creation: true,
			pullRequest: {
				dismissStaleReviewsOnPush: true,
				requiredApprovingReviewCount: 0,
				requiredReviewThreadResolution: true,
				allowedMergeMethods: ["merge", "squash", "rebase"],
			},
		},
		// The repository predates this component and the ruleset was made in
		// the UI, so both are adopted rather than created.
		repoOptions: {
			aliases: [
				"urn:pulumi:prod::vcs::github:index/repository:Repository::tdl",
			],
		},
		rulesetOptions: { import: "tdl:962997" },
	},
	{ protect: true },
);

// The triage states tdl's docs/agents/triage-labels.md names. Each label is
// its own resource, so the labels GitHub made with the repository stay
// unmanaged; `wontfix` is one of them, which is why it is missing here.
const tdlTriageLabels: Record<
	string,
	{ color: string; description: string }
> = {
	"needs-triage": {
		color: "fbca04",
		description: "Maintainer needs to evaluate this issue",
	},
	"needs-info": {
		color: "d876e3",
		description: "Waiting on reporter for more information",
	},
	"ready-for-agent": {
		color: "0e8a16",
		description: "Fully specified, ready for an AFK agent",
	},
	"ready-for-human": {
		color: "1d76db",
		description: "Requires human implementation",
	},
};

for (const [name, args] of Object.entries(tdlTriageLabels)) {
	new gh.IssueLabel(`tdl-${name}`, {
		repository: tdl.repo.name,
		name,
		...args,
	});
}

export const terraform2crd = new PublicRepo("terraform2crd", {
	description:
		"Converts Terraform provider code specs to Custom Resource Definitions (CRDs)",
	requiredChecks: [
		{ context: "build", integrationId: integrationIds.github },
		{ context: "lint", integrationId: integrationIds.github },
		{ context: "docker", integrationId: integrationIds.github },
	],
});

export const docker2nix = new PublicRepo("docker2nix", {
	description: "Converts Docker images to Nix expressions",
	topics: ["docker", "nix", "ux", "codegen"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const ux = new PublicRepo("ux", {
	description: "Expressive artifact conversion pipelines",
	topics: ["codegen", "go", "nix"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});
