import * as gitlab from "@pulumi/gitlab";
import type { Input } from "@pulumi/pulumi";

export interface ProjectArgs {
	description?: Input<string>;
	/** Display name within the group. Defaults to `path`, or the Pulumi resource name. */
	name?: string;
	path?: string;
	visibility?: "public" | "private";
	archived?: boolean;
	/** Fields included in the sub claim of the CI ID token. Defaults to the provider default (project_path, ref_type, ref). */
	ciIdTokenSubClaimComponents?: Input<Input<string>[]>;
}

export function projectIn(
	group: gitlab.Group,
	resourceName: string,
	args: ProjectArgs = {},
) {
	const name = args.name ?? args.path ?? resourceName;
	const path = args.path ?? name;
	return new gitlab.Project(resourceName, {
		name,
		path,
		namespaceId: group.id.apply((x) => Number(x)),
		description: args.description,
		visibilityLevel: args.visibility ?? "public",
		archived: args.archived,
		ciIdTokenSubClaimComponents: args.ciIdTokenSubClaimComponents,
	}, { parent: group });
}

export interface SubgroupArgs {
	/** Path segment within the parent. Also the display name unless `name` is set. */
	path: string;
	description: Input<string>;
	name?: string;
}

/**
 * A group nested under `parent`. Subgroups have no global-uniqueness or
 * manual-creation constraints, so Pulumi can create them directly.
 */
export function subgroup(
	resourceName: string,
	parent: gitlab.Group,
	args: SubgroupArgs,
) {
	return new gitlab.Group(resourceName, {
		name: args.name ?? args.path,
		path: args.path,
		parentId: parent.id.apply((x) => Number(x)),
		description: args.description,
		visibilityLevel: "public",
	}, { parent });
}
