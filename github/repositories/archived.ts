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
