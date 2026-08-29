// import { projectIn, subgroup } from "../../../util";
// import { forksGroup } from "../group";

// export const forksTalosGroup = subgroup("forks-talos", forksGroup, {
// 	path: "talos",
// 	description: "Sidero/Talos-ecosystem forks.",
// });

// // Fork — provider-discovery convention (clusterctl/registry). Never rename.
// export const clusterApiBootstrapProviderTalos = projectIn(forksTalosGroup, "cluster-api-bootstrap-provider-talos", {
// 	description: "A cluster-api bootstrap provider for deploying Talos clusters.",
// });

// // Fork — provider-discovery convention (clusterctl/registry). Never rename.
// export const clusterApiControlPlaneProviderTalos = projectIn(forksTalosGroup, "cluster-api-control-plane-provider-talos", {
// 	description: "A control plane provider for CAPI + Talos",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const qemuGuestAgentTalos = projectIn(forksTalosGroup, "qemu-guest-agent-talos", {
// 	description: "Run the qemu guest agent as daemonset on talos. Good for proxmox as it uses the guest agent to shutdown and reboot hosts.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const pulumiTalos = projectIn(forksTalosGroup, "pulumi-talos", {
// 	description: "Pulumi provider for Talos",
// });
