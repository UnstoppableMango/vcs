import * as gh from "@pulumi/github";
import { integrationIds, PublicRepo } from "../components";

export const audio = new gh.Repository(
	"audio",
	{
		name: "audio",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowRebaseMerge: false,
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

export const fpCs = new PublicRepo("fp-cs", {
	description: "A functional programming library for C#",
	topics: ["csharp", "functional-programming", "library"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const http = new gh.Repository(
	"http",
	{
		name: "http",
		allowAutoMerge: true,
		allowMergeCommit: false,
		allowUpdateBranch: true,
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
		squashMergeCommitTitle: "PR_TITLE",
		visibility: "public",
	},
	{ protect: true },
);

new gh.RepositoryVulnerabilityAlerts(
	"http",
	{
		repository: http.name,
	},
	{ parent: http },
);

export const rest = new gh.Repository(
	"rest",
	{
		name: "rest",
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description: "Just another .NET REST client",
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
	"rest",
	{
		repository: rest.name,
	},
	{ parent: rest },
);

export const xml = new gh.Repository(
	"xml",
	{
		name: "xml",
		allowMergeCommit: false,
		deleteBranchOnMerge: true,
		description: "A .NET XML serializer",
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
	"xml",
	{
		repository: xml.name,
	},
	{ parent: xml },
);

export const ocamlGo = new PublicRepo("ocaml-go", {
	description: "An implementation of Go in OCaml for fun",
	topics: ["go", "ocaml", "practice", "ast", "parser", "lexer"],
});

export const x12 = new PublicRepo("x12", {
	description: "Path based application framework",
	topics: ["go", "framework", "paths"],
});
