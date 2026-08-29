// import { projectIn, subgroup } from "../../../util";
// import { forksGroup } from "../group";

// export const forksPulumiGroup = subgroup("forks-pulumi", forksGroup, {
// 	path: "pulumi",
// 	description: "Forks of pulumi/* itself — not the original-work pulumi group above.",
// });

// // Fork of pulumi/pulumi itself — the CLI/engine, not this project's own tooling.
// export const pulumi = projectIn(forksPulumiGroup, "pulumi", {
// 	description: "Pulumi - Infrastructure as Code in any programming language 🚀",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const crd2pulumi = projectIn(forksPulumiGroup, "crd2pulumi", {
// 	description: "Generate typed CustomResources from a Kubernetes CustomResourceDefinition",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const pulumiKubernetesx = projectIn(forksPulumiGroup, "pulumi-kubernetesx", {
// 	description: "Kubernetes for Everyone",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const pulumiTemplates = projectIn(forksPulumiGroup, "pulumi-templates", {
// 	description: "Templates used by `pulumi new`",
// });
