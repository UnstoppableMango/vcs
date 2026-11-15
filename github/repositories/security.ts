import * as command from "@pulumi/command";
import * as gh from "@pulumi/github";
import { Config } from "@pulumi/pulumi";
import type { PublicRepo } from "pulumi-components";

const github = new Config("github");

// The REST call that turns private vulnerability reporting on (PUT) or off
// (DELETE). It runs under bun, the program's own runtime, so the operator
// needs no other tool on PATH.
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
	`METHOD=${method} bun -e '${script}'`;

export interface SecurityReportingOptions {
	/**
	 * Lets anyone open a private security advisory from the repository's
	 * Security tab. GitHub offers it only on public repositories.
	 */
	privateVulnerabilityReporting?: boolean;
}

/**
 * Adds the security reporting settings pulumi-github cannot declare. Dependabot
 * alerts need nothing here: PublicRepo already declares them with its
 * RepositoryVulnerabilityAlerts. Dependabot security updates stay off, since
 * Renovate makes the updates.
 *
 * Private vulnerability reporting has no pulumi-github resource, and the bun
 * runtime cannot run a dynamic provider, so a command makes the REST call: on
 * create, and again whenever the repository it names changes. Removing the
 * option deletes the command, which turns reporting back off.
 */
export function addSecurityReporting(
	prefix: string,
	repo: PublicRepo | gh.Repository,
	opts: SecurityReportingOptions,
): void {
	if (!opts.privateVulnerabilityReporting) return;

	const name = repo instanceof gh.Repository ? repo.name : repo.repo.name;
	const repository = name.apply((n) => `${github.require("owner")}/${n}`);

	new command.local.Command(`${prefix}-private-vulnerability-reporting`, {
		create: call("PUT"),
		delete: call("DELETE"),
		environment: {
			REPOSITORY: repository,
			GITHUB_TOKEN: github.requireSecret("token"),
		},
		triggers: [repository],
	});
}
