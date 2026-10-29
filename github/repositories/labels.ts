import * as gh from "@pulumi/github";
import type { PrivateRepo, PublicRepo } from "pulumi-components";

type Label = { color: string; description: string };

// The triage states a repo's docs/agents/triage-labels.md names. Each label is
// its own resource, so the labels GitHub made with the repository stay
// unmanaged; `wontfix` is one of them, which is why it is missing here.
const triageLabels: Record<string, Label> = {
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

// The labels /wayfinder reads, per a repo's docs/agents/issue-tracker.md: one
// for the map issue and one per ticket type. `wayfinder:map` keeps the grey,
// undescribed look it was first made with. Kept in step with unmango/scm's
// github/labels.ts.
const wayfinderLabels: Record<string, Label> = {
	"wayfinder:map": {
		color: "ededed",
		description: "",
	},
	"wayfinder:research": {
		color: "c5def5",
		description: "Wayfinder ticket resolved by reading sources (AFK)",
	},
	"wayfinder:prototype": {
		color: "bfd4f2",
		description:
			"Wayfinder ticket resolved by reacting to a rough artifact (HITL)",
	},
	"wayfinder:grilling": {
		color: "d4c5f9",
		description: "Wayfinder ticket resolved in conversation (HITL)",
	},
	"wayfinder:task": {
		color: "fef2c0",
		description: "Wayfinder ticket for work a decision waits on",
	},
};

export type LabeledRepo = PublicRepo | PrivateRepo | gh.Repository;

export interface AgentLabelOptions {
	triageLabels?: boolean;
	wayfinderLabels?: boolean;
	/** Import IDs (`<repo>:<label>`) of labels made by hand, keyed by label. */
	imports?: Record<string, string>;
}

/**
 * Adds the labels the agent skills apply: the triage states and the wayfinder
 * ticket types.
 */
export function addAgentLabels(
	prefix: string,
	repo: LabeledRepo,
	opts: AgentLabelOptions = {},
): void {
	const repository = repo instanceof gh.Repository ? repo.name : repo.repo.name;
	const labels = {
		...(opts.triageLabels === false ? {} : triageLabels),
		...(opts.wayfinderLabels === false ? {} : wayfinderLabels),
	};
	for (const [name, args] of Object.entries(labels)) {
		const id = opts.imports?.[name];
		new gh.IssueLabel(
			`${prefix}-${name}`,
			{ repository, name, ...args },
			// An import fails unless its inputs match the label as it is, and a
			// hand-made label's look is whatever it was made with. Adopt it as is;
			// once the import is dropped, the next up brings it in line.
			id ? { import: id, ignoreChanges: ["color", "description"] } : undefined,
		);
	}
}
