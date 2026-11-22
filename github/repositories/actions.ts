import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as command from "@pulumi/command";
import { Config, type Input, output } from "@pulumi/pulumi";

const github = new Config("github");

const script = "scripts/fork-pr-approval.ts";

// Reruns create when the script changes.
const scriptHash = createHash("sha256")
	.update(readFileSync(script))
	.digest("hex");

type ApprovalPolicy =
	| "all_external_contributors"
	| "first_time_contributors"
	| "first_time_contributors_new_to_github";

const call = (policy: ApprovalPolicy) => `bun ${script} ${policy}`;

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
			SCRIPT_HASH: scriptHash,
		},
	});
}
