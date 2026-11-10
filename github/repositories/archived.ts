import * as gh from "@pulumi/github";

export const infra = new gh.Repository("infra", {
	name: "infra",
	allowMergeCommit: false,
	deleteBranchOnMerge: true,
	hasIssues: true,
	visibility: "private",
	archived: true,
});

export const minecraftOperator = new gh.Repository("minecraft-operator", {
	description: "An operator for managing minecraft servers on Kubernetes",
	allowMergeCommit: false,
	deleteBranchOnMerge: true,
	archived: true,
});

// The github repository was managed by hand until it was archived, so it is
// adopted with an import. None of its settings were ever declared here, and an
// archived repository is read-only, so every input except `name` and
// `archived` is left as GitHub has it.
//
// Archiving takes two applies. The first imports the repository, which needs
// `archived` ignored too, because an import fails on any input that differs
// from the live repository. The second drops the import, stops ignoring
// `archived`, which archives it, and removes the repository's ruleset in
// github/index.ts.
export const github = new gh.Repository(
	"github",
	{ name: "github", archived: true },
	{
		import: "github",
		protect: true,
		ignoreChanges: [
			"allowAutoMerge",
			"allowForking",
			"allowMergeCommit",
			"allowRebaseMerge",
			"allowSquashMerge",
			"allowUpdateBranch",
			"archiveOnDestroy",
			"archived",
			"autoInit",
			"defaultBranch",
			"deleteBranchOnMerge",
			"description",
			"etag",
			"fork",
			"gitignoreTemplate",
			"hasDiscussions",
			"hasDownloads",
			"hasIssues",
			"hasProjects",
			"hasWiki",
			"homepageUrl",
			"ignoreVulnerabilityAlertsDuringRead",
			"isTemplate",
			"licenseTemplate",
			"mergeCommitMessage",
			"mergeCommitTitle",
			"pages",
			"private",
			"securityAndAnalysis",
			"sourceOwner",
			"sourceRepo",
			"squashMergeCommitMessage",
			"squashMergeCommitTitle",
			"template",
			"topics",
			"visibility",
			"vulnerabilityAlerts",
			"webCommitSignoffRequired",
		],
	},
);
