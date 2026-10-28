import * as gh from "@pulumi/github";
import type { PublicRepo } from "pulumi-components";

// The labels /wayfinder reads, per a repo's docs/agents/issue-tracker.md: one
// for the map issue and one per ticket type. The provider's IssueLabel create
// adopts a label that already exists by name, so a repo where `wayfinder:map`
// was made by hand needs no import.
const wayfinderLabels: Record<string, { color: string; description: string }> =
	{
		"wayfinder:map": {
			color: "5319e7",
			description: "A wayfinder map: the index of decisions toward a destination",
		},
		"wayfinder:research": {
			color: "c5def5",
			description: "Wayfinder ticket resolved by reading sources (AFK)",
		},
		"wayfinder:prototype": {
			color: "bfd4f2",
			description: "Wayfinder ticket resolved by reacting to a rough artifact (HITL)",
		},
		"wayfinder:grilling": {
			color: "d4c5f9",
			description: "Wayfinder ticket resolved in conversation (HITL)",
		},
		"wayfinder:task": {
			color: "e4e669",
			description: "Wayfinder ticket for work a decision waits on",
		},
	};

export function addWayfinderLabels(
	prefix: string,
	repo: PublicRepo | gh.Repository,
): void {
	const repository = repo instanceof gh.Repository ? repo.name : repo.repo.name;
	for (const [name, args] of Object.entries(wayfinderLabels)) {
		new gh.IssueLabel(`${prefix}-${name}`, {
			repository,
			name,
			...args,
		});
	}
}
