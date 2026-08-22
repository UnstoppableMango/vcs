import * as gitlab from "@pulumi/gitlab";

/**
 * GitLab.com does not allow creating top-level groups via the API/Terraform provider.
 * Each of the top-level `gitlab.Group`s below must be created once by hand in the
 * GitLab UI, then imported before `pulumi up` will do anything useful with it:
 *
 *   pulumi import gitlab:index/group:Group homelab homelab
 *   pulumi import gitlab:index/group:Group personal personal
 *   ...(one per top-level group, path == the group's `path` below)
 *
 * Subgroups (libraries/dotnet, demos/imaug, forks/*) have no such restriction and
 * can be created directly by Pulumi via `parentId`.
 */

export const homelabGroup = new gitlab.Group("homelab", {
	name: "homelab",
	path: "homelab",
	description: "Physical + cluster infrastructure that keeps THECLUSTER running.",
	visibilityLevel: "public",
});

export const personalGroup = new gitlab.Group("personal", {
	name: "personal",
	path: "personal",
	description: "Identity, personal config, and one-off life admin.",
	visibilityLevel: "public",
});

export const pulumiGroup = new gitlab.Group("pulumi", {
	name: "pulumi",
	path: "pulumi",
	description: "Own Pulumi providers, components, and the IaC repos that drive them.",
	visibilityLevel: "public",
});

export const terraformGroup = new gitlab.Group("terraform", {
	name: "terraform",
	path: "terraform",
	description: "Own Terraform providers. Repo names stay exactly terraform-provider-* — see note in each project.",
	visibilityLevel: "public",
});

export const operatorsGroup = new gitlab.Group("operators", {
	name: "operators",
	path: "operators",
	description: "Custom Kubernetes controllers/operators for self-hosted services.",
	visibilityLevel: "public",
});

export const uxGroup = new gitlab.Group("ux", {
	name: "ux",
	path: "ux",
	description: "The universal codegen framework and its family of source2target converters.",
	visibilityLevel: "public",
});

export const librariesGroup = new gitlab.Group("libraries", {
	name: "libraries",
	path: "libraries",
	description: "Standalone libraries, grouped by ecosystem.",
	visibilityLevel: "public",
});

export const funGroup = new gitlab.Group("fun", {
	name: "fun",
	path: "fun",
	description: "Hobby-grade .NET libraries and language experiments.",
	visibilityLevel: "public",
});

export const applicationsGroup = new gitlab.Group("applications", {
	name: "applications",
	path: "applications",
	description: "End-user apps and bots with a UI or a Discord presence.",
	visibilityLevel: "public",
});

export const demosGroup = new gitlab.Group("demos", {
	name: "demos",
	path: "demos",
	description: "Conference talks, katas, and one-off learning exercises.",
	visibilityLevel: "public",
});

export const utilitiesGroup = new gitlab.Group("utilities", {
	name: "utilities",
	path: "utilities",
	description: "Small standalone tools that don't belong to a bigger family.",
	visibilityLevel: "public",
});

export const workGroup = new gitlab.Group("work", {
	name: "work",
	path: "work",
	description: "Client and employer-adjacent proof-of-concepts.",
	visibilityLevel: "public",
});

export const archivedGroup = new gitlab.Group("archived", {
	name: "archived",
	path: "archived",
	description: "Repos already archived:true on GitHub. Parked, not maintained.",
	visibilityLevel: "public",
});

export const forksGroup = new gitlab.Group("forks", {
	name: "forks",
	path: "forks",
	description: "Third-party forks kept for upstream PRs. Every project below keeps its upstream name exactly.",
	visibilityLevel: "public",
});

export const librariesDotnetGroup = new gitlab.Group("dotnet", {
	name: "dotnet",
	path: "dotnet",
	parentId: librariesGroup.id.apply((x) => Number(x)),
	description: "F#/C# packages published to NuGet — names are package IDs, kept as-is.",
	visibilityLevel: "public",
}, { parent: librariesGroup });

export const librariesGoGroup = new gitlab.Group("go", {
	name: "go",
	path: "go",
	parentId: librariesGroup.id.apply((x) => Number(x)),
	description: "Standalone Go packages.",
	visibilityLevel: "public",
}, { parent: librariesGroup });

export const demosImaugGroup = new gitlab.Group("imaug", {
	name: "imaug",
	path: "imaug",
	parentId: demosGroup.id.apply((x) => Number(x)),
	description: "IMAUG conference talk repos — renamed now that the group name carries the context.",
	visibilityLevel: "public",
}, { parent: demosGroup });

export const forksKubernetesGroup = new gitlab.Group("kubernetes", {
	name: "kubernetes",
	path: "kubernetes",
	parentId: forksGroup.id.apply((x) => Number(x)),
	description: "Kubernetes-ecosystem forks.",
	visibilityLevel: "public",
}, { parent: forksGroup });

export const forksProxmoxGroup = new gitlab.Group("proxmox", {
	name: "proxmox",
	path: "proxmox",
	parentId: forksGroup.id.apply((x) => Number(x)),
	description: "k8s-proxmox org forks.",
	visibilityLevel: "public",
}, { parent: forksGroup });

export const forksTalosGroup = new gitlab.Group("talos", {
	name: "talos",
	path: "talos",
	parentId: forksGroup.id.apply((x) => Number(x)),
	description: "Sidero/Talos-ecosystem forks.",
	visibilityLevel: "public",
}, { parent: forksGroup });

export const forksPulumiGroup = new gitlab.Group("pulumi", {
	name: "pulumi",
	path: "pulumi",
	parentId: forksGroup.id.apply((x) => Number(x)),
	description: "Forks of pulumi/* itself — not the original-work Pulumi group above.",
	visibilityLevel: "public",
}, { parent: forksGroup });

export const forksNixGroup = new gitlab.Group("nix", {
	name: "nix",
	path: "nix",
	parentId: forksGroup.id.apply((x) => Number(x)),
	description: "Nix ecosystem forks.",
	visibilityLevel: "public",
}, { parent: forksGroup });

export const forksMiscGroup = new gitlab.Group("misc", {
	name: "misc",
	path: "misc",
	parentId: forksGroup.id.apply((x) => Number(x)),
	description: "Everything else — one fork each of a lot of different worlds.",
	visibilityLevel: "public",
}, { parent: forksGroup });
