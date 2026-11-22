import * as command from "@pulumi/command";
import { Config, type Input, output } from "@pulumi/pulumi";

const github = new Config("github");

// Reaches bun through the environment, so no quote in it can break the shell
// command.
const script = `
const url = "https://api.github.com/repos/" + process.env.REPOSITORY + "/actions/permissions/fork-pr-contributor-approval";
const res = await fetch(url, {
	method: "PUT",
	headers: {
		Accept: "application/vnd.github+json",
		Authorization: "Bearer " + process.env.GITHUB_TOKEN,
		"X-GitHub-Api-Version": "2022-11-28",
	},
	body: JSON.stringify({ approval_policy: process.env.POLICY }),
});
if (!res.ok) {
	console.error(res.status, await res.text());
	process.exit(1);
}
`;

type ApprovalPolicy =
	| "all_external_contributors"
	| "first_time_contributors"
	| "first_time_contributors_new_to_github";

const call = (policy: ApprovalPolicy) => `POLICY=${policy} bun -e "$SCRIPT"`;

// pulumi-github has no resource for this, and the bun runtime can't run a
// dynamic provider. No triggers: a replacement would run the old command's
// delete after the new one's create, putting the default back.
export function addForkPrApproval(
	prefix: string,
	repositoryName: Input<string>,
): command.local.Command {
	const owner = github.require("owner");
	const repository = output(repositoryName).apply((n) => `${owner}/${n}`);

	return new command.local.Command(`${prefix}-fork-pr-approval`, {
		create: call("all_external_contributors"),
		delete: call("first_time_contributors"),
		environment: {
			REPOSITORY: repository,
			GITHUB_TOKEN: github.requireSecret("token"),
			SCRIPT: script,
		},
	});
}
