import { projectIn } from "../util";
import { rootGroup } from "./group";

export { rootGroup };

export const architecture = projectIn(rootGroup, "architecture", {
	description: "How my systems fit together",
});

export const iam = projectIn(rootGroup, "iam", {
	description: "Identity and access management",
	visibility: "private",
});

/*
 * One directory per group, mirroring the paths on gitlab.com. A directory's
 * `group.ts` declares the group itself and `index.ts` declares the projects in
 * it, so a nested group is a nested directory and nothing has to reach across
 * the tree to find its parent.
 *
 * Converter groups follow a second rule on top of that: the group is the input
 * format and the project is `2<target>`, so `unmango/openapi/2go` reads as
 * "openapi to go" and everything sharing an input parser sits together. Input
 * formats that already have a group reuse it, which is why `pulumi2crd` lives
 * beside the Pulumi providers instead of in a group of its own.
 */

// export * as applications from "./applications";
export * as aspire from "./aspire";
export * as buf from "./buf";
// export * as demos from "./demos";
export * as docker from "./docker";
// export * as forks from "./forks";
// export * as fun from "./fun";
export * as goreleaser from "./goreleaser";
export * as gossamer from "./gossamer";
// export * as homelab from "./homelab";
export * as libraries from "./libraries";
export * as nix from "./nix";
export * as openapi from "./openapi";
export * as operators from "./operators";
export * as personal from "./personal";
export * as pulumi from "./pulumi";
export * as sql from "./sql";
export * as utilities from "./utilities";
// export * as ux from "./ux";
export * as work from "./work";
