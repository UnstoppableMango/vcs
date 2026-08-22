import * as gitlab from "@pulumi/gitlab";
import type { Input } from "@pulumi/pulumi";

export interface ProjectArgs {
	description?: Input<string>;
	path?: string;
	visibility?: "public" | "private";
	archived?: boolean;
}

export function projectIn(
	group: gitlab.Group,
	name: string,
	args: ProjectArgs = {},
) {
	const path = args.path ?? name;
	return new gitlab.Project(name, {
		name,
		path,
		namespaceId: group.id.apply((x) => Number(x)),
		description: args.description,
		visibilityLevel: args.visibility ?? "public",
		archived: args.archived,
	}, { parent: group });
}
