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

// The github repository was managed by hand until it was archived, and was
// adopted with an import. None of its settings were ever declared here, and an
// archived repository is read-only, so every input except `name` and
// `archived` is left as GitHub has it. Its ruleset was dropped from state, not
// deleted, so it still protects main on the archived repository.
export const github = new gh.Repository(
	"github",
	{ name: "github", archived: true },
	{
		protect: true,
		ignoreChanges: [
			"allowAutoMerge",
			"allowForking",
			"allowMergeCommit",
			"allowRebaseMerge",
			"allowSquashMerge",
			"allowUpdateBranch",
			"archiveOnDestroy",
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
