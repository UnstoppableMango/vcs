import * as gh from "@pulumi/github";
import type { PublicRepo } from "pulumi-components";

// The triage states a repo's docs/agents/triage-labels.md names. Each label is
// its own resource, so the labels GitHub made with the repository stay
// unmanaged; `wontfix` is one of them, which is why it is missing here.
const triageLabels: Record<string, { color: string; description: string }> = {
	"needs-triage": {
		color: "fbca04",
		description: "Maintainer needs to evaluate this issue",
	},
	"needs-info": {
		color: "d876e3",
		description: "Waiting on reporter for more information",
	},
	"ready-for-agent": {
		color: "0e8a16",
		description: "Fully specified, ready for an AFK agent",
	},
	"ready-for-human": {
		color: "1d76db",
		description: "Requires human implementation",
	},
};

export function addTriageLabels(prefix: string, repo: PublicRepo): void {
	for (const [name, args] of Object.entries(triageLabels)) {
		new gh.IssueLabel(`${prefix}-${name}`, {
			repository: repo.repo.name,
			name,
			...args,
		});
	}
}
