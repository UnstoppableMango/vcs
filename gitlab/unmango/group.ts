import * as gitlab from "@pulumi/gitlab";

/**
 * Everything lives under a single top-level group.
 *
 * Two GitLab.com facts drive this shape:
 *
 *   1. Top-level groups cannot be created via the API/Terraform provider, so
 *      every root costs a manual UI step plus a `pulumi import`.
 *   2. Top-level paths are globally unique across all of gitlab.com. Generic
 *      names like `pulumi` and `libraries` are already taken by other parties,
 *      so a flat set of category roots is not even registrable.
 *
 * One namespaced root solves both. It is the only group created by hand;
 * every category below it is an ordinary subgroup that Pulumi creates via
 * `parentId`, and category names only have to be unique within the root.
 *
 * One-time setup, before the first `pulumi up`:
 *
 *   1. Create the group at https://gitlab.com/groups/new (path: unmango)
 *   2. pulumi import gitlab:index/group:Group unmango unmango
 */
export const rootGroup = new gitlab.Group("unmango", {
	name: "unmango",
	path: "unmango",
	description: "UnstoppableMango's projects, mirrored from GitHub.",
	visibilityLevel: "public",
});
