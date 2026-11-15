import * as command from "@pulumi/command";
import { Config } from "@pulumi/pulumi";
import type { PublicRepo } from "pulumi-components";

const github = new Config("github");

// The REST call that turns private vulnerability reporting on (PUT) or off
// (DELETE). It runs under bun, the program's own runtime, so the operator
// needs no tool on PATH beyond the command plugin. It reaches bun through the
// environment, so no quoting in it can break the shell command.
const script = `
const url = "https://api.github.com/repos/" + process.env.REPOSITORY + "/private-vulnerability-reporting";
const res = await fetch(url, {
	method: process.env.METHOD,
	headers: {
		Accept: "application/vnd.github+json",
		Authorization: "Bearer " + process.env.GITHUB_TOKEN,
		"X-GitHub-Api-Version": "2022-11-28",
	},
});
if (!res.ok) {
	console.error(res.status, await res.text());
	process.exit(1);
}
`;

const call = (method: "PUT" | "DELETE") =>
	`METHOD=${method} bun -e "$SCRIPT"`;

export interface SecurityReportingOptions {
	/**
	 * Lets anyone open a private security advisory from the repository's
	 * Security tab. GitHub offers it only on public repositories.
	 */
	privateVulnerabilityReporting?: boolean;
}

/**
 * Adds the security reporting settings pulumi-github cannot declare to a
 * PublicRepo. Dependabot alerts need nothing here: every PublicRepo already
 * declares them with its RepositoryVulnerabilityAlerts. Dependabot security updates stay off, since
 * Renovate makes the updates.
 *
 * Private vulnerability reporting has no pulumi-github resource, and the bun
 * runtime cannot run a dynamic provider, so a command makes the REST call: on
 * create, and again whenever its environment changes, such as a renamed
 * repository or a rotated token. It takes no triggers: a replacement would
 * create the new command before deleting the old one, and the old one's DELETE
 * would follow GitHub's redirect from a renamed repository and turn reporting
 * off. Removing the option deletes the command, which turns reporting back off.
 */
export function addSecurityReporting(
	prefix: string,
	repo: PublicRepo,
	opts: SecurityReportingOptions,
): void {
	if (!opts.privateVulnerabilityReporting) return;

	const owner = github.require("owner");
	const repository = repo.repo.name.apply((n) => `${owner}/${n}`);

	new command.local.Command(`${prefix}-private-vulnerability-reporting`, {
		create: call("PUT"),
		delete: call("DELETE"),
		environment: {
			REPOSITORY: repository,
			GITHUB_TOKEN: github.requireSecret("token"),
			SCRIPT: script,
		},
	});
}
