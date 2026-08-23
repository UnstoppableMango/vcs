import * as gitlab from "@pulumi/gitlab";
import { subgroup } from "./util";

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

export const homelabGroup = subgroup("homelab", rootGroup, {
	path: "homelab",
	description: "Physical + cluster infrastructure that keeps THECLUSTER running.",
});

export const personalGroup = subgroup("personal", rootGroup, {
	path: "personal",
	description: "Identity, personal config, and one-off life admin.",
});

export const pulumiGroup = subgroup("pulumi", rootGroup, {
	path: "pulumi",
	description: "Own Pulumi providers, components, and the IaC repos that drive them.",
});

export const terraformGroup = subgroup("terraform", rootGroup, {
	path: "terraform",
	description: "Own Terraform providers. Repo names stay exactly terraform-provider-* — see note in each project.",
});

export const operatorsGroup = subgroup("operators", rootGroup, {
	path: "operators",
	description: "Custom Kubernetes controllers/operators for self-hosted services.",
});

export const uxGroup = subgroup("ux", rootGroup, {
	path: "ux",
	description: "The universal codegen framework and its family of source2target converters.",
});

export const librariesGroup = subgroup("libraries", rootGroup, {
	path: "libraries",
	description: "Standalone libraries, grouped by ecosystem.",
});

export const funGroup = subgroup("fun", rootGroup, {
	path: "fun",
	description: "Hobby-grade .NET libraries and language experiments.",
});

export const applicationsGroup = subgroup("applications", rootGroup, {
	path: "applications",
	description: "End-user apps and bots with a UI or a Discord presence.",
});

export const demosGroup = subgroup("demos", rootGroup, {
	path: "demos",
	description: "Conference talks, katas, and one-off learning exercises.",
});

export const utilitiesGroup = subgroup("utilities", rootGroup, {
	path: "utilities",
	description: "Small standalone tools that don't belong to a bigger family.",
});

export const workGroup = subgroup("work", rootGroup, {
	path: "work",
	description: "Client and employer-adjacent proof-of-concepts.",
});

export const archivedGroup = subgroup("archived", rootGroup, {
	path: "archived",
	description: "Repos already archived:true on GitHub. Parked, not maintained.",
});

export const forksGroup = subgroup("forks", rootGroup, {
	path: "forks",
	description: "Third-party forks kept for upstream PRs. Every project below keeps its upstream name exactly.",
});

export const librariesDotnetGroup = subgroup("libraries-dotnet", librariesGroup, {
	path: "dotnet",
	description: "F#/C# packages published to NuGet — names are package IDs, kept as-is.",
});

export const librariesGoGroup = subgroup("libraries-go", librariesGroup, {
	path: "go",
	description: "Standalone Go packages.",
});

export const demosImaugGroup = subgroup("demos-imaug", demosGroup, {
	path: "imaug",
	description: "IMAUG conference talk repos — renamed now that the group name carries the context.",
});

export const forksKubernetesGroup = subgroup("forks-kubernetes", forksGroup, {
	path: "kubernetes",
	description: "Kubernetes-ecosystem forks.",
});

export const forksProxmoxGroup = subgroup("forks-proxmox", forksGroup, {
	path: "proxmox",
	description: "k8s-proxmox org forks.",
});

export const forksTalosGroup = subgroup("forks-talos", forksGroup, {
	path: "talos",
	description: "Sidero/Talos-ecosystem forks.",
});

export const forksPulumiGroup = subgroup("forks-pulumi", forksGroup, {
	path: "pulumi",
	description: "Forks of pulumi/* itself — not the original-work pulumi group above.",
});

export const forksNixGroup = subgroup("forks-nix", forksGroup, {
	path: "nix",
	description: "Nix ecosystem forks.",
});

export const forksMiscGroup = subgroup("forks-misc", forksGroup, {
	path: "misc",
	description: "Everything else — one fork each of a lot of different worlds.",
});
