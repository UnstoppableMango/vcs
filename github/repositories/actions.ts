import * as command from "@pulumi/command";
import { Config, type Input, output } from "@pulumi/pulumi";

const github = new Config("github");

// The REST call that sets which fork pull requests wait for a maintainer's
// approval before their workflows run. It runs under bun, as security.ts's
// call does, and reaches it through the environment for the same reason.
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

// The policies GitHub offers, strictest first, as the API names them.
type ApprovalPolicy =
	| "all_external_contributors"
	| "first_time_contributors"
	| "first_time_contributors_new_to_github";

const call = (policy: ApprovalPolicy) => `POLICY=${policy} bun -e "$SCRIPT"`;

/**
 * Makes every pull request from an outside collaborator's fork wait for
 * approval before its workflows run, GitHub's "Require approval for all
 * outside collaborators". Only Erik's own commits and his bots run on-prem
 * (the Nix CI spec's trust model), so a fork never reaches a self-hosted
 * runner unseen. GitHub offers this setting only on public repositories.
 *
 * pulumi-github has no resource for it, so a command makes the REST call, as
 * security.ts does and for the same reasons: on create, and again whenever its
 * environment changes, with no triggers. Deleting the command puts back
 * GitHub's default, which asks only first-time contributors.
 */
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
