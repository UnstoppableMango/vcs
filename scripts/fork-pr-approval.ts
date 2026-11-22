// Sets a repository's fork PR contributor approval policy: bun scripts/fork-pr-approval.ts <policy>
const policy = process.argv[2];
const url = `https://api.github.com/repos/${process.env.REPOSITORY}/actions/permissions/fork-pr-contributor-approval`;
const res = await fetch(url, {
	method: "PUT",
	headers: {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
		"Content-Type": "application/json",
		"X-GitHub-Api-Version": "2022-11-28",
	},
	body: JSON.stringify({ approval_policy: policy }),
});
if (!res.ok) {
	console.error(res.status, await res.text());
	process.exit(1);
}
