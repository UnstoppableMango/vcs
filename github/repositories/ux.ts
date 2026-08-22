import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "../components";

export const a2b = new PublicRepo("a2b", {
	description: "Registry for converter utilities",
	topics: ["ux", "go", "dotnet", "nix", "codegen"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const gast = new PublicRepo("gast", {
	description: "ASTs for everyone",
	topics: ["ast", "codegen", "protobuf", "grpc", "buf"],
	requiredChecks: [
		{ context: "Build and Test", integrationId: integrationIds.github },
	],
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

export const tdl = new gh.Repository(
	"tdl",
	{
		name: "tdl",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowUpdateBranch: true,
		deleteBranchOnMerge: true,
		description: "Type description language and codegen suite",
		hasIssues: true,
		hasProjects: true,
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
		webCommitSignoffRequired: true,
	},
	{ protect: true },
);

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
	description: `The universal codegen framework`,
	topics: ["codegen", "go", "protobuf"],
	requiredChecks: [
		{ context: "build", integrationId: integrationIds.github },
		{ context: "lint", integrationId: integrationIds.github },
		{ context: "docker", integrationId: integrationIds.github },
		{ context: "clean", integrationId: integrationIds.github },
	],
});
