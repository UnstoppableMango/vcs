import { projectIn } from "../util";
// import {
// 	forksKubernetesGroup,
// 	forksProxmoxGroup,
// 	forksTalosGroup,
// 	forksPulumiGroup,
// 	forksNixGroup,
// 	forksMiscGroup,
// } from "../groups";

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const piholeKubernetes = projectIn(forksKubernetesGroup, "pihole-kubernetes", {
// 	description: "PiHole on kubernetes",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const clusterApi = projectIn(forksKubernetesGroup, "cluster-api", {
// 	description: "Home for Cluster API, a subproject of sig-cluster-lifecycle",
// });

// // Fork — provider-discovery convention (clusterctl/registry). Never rename.
// export const clusterApiProviderBringyourownhost = projectIn(forksKubernetesGroup, "cluster-api-provider-bringyourownhost", {
// 	description: "Kubernetes Cluster API Provider BYOH for already-provisioned hosts running Linux.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const cloudflareTunnelIngressController = projectIn(forksKubernetesGroup, "cloudflare-tunnel-ingress-controller", {
// 	description: "🚀 Expose the website directly into the internet! The Kuberntes Ingress Controller based on Cloudflare Tunnel.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const k3os = projectIn(forksKubernetesGroup, "k3os", {
// 	description: "Purpose-built OS for Kubernetes, fully managed by Kubernetes.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const kubeletServingCertApprover = projectIn(forksKubernetesGroup, "kubelet-serving-cert-approver", {
// 	description: "Kubelet Serving TLS Certificate Signing Request Approver",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const kubernetesWebsite = projectIn(forksKubernetesGroup, "kubernetes-website", {
// 	description: "Kubernetes website and documentation repo: ",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const operatorSdk = projectIn(forksKubernetesGroup, "operator-sdk", {
// 	description: "SDK for building Kubernetes applications. Provides high level APIs, useful abstractions, and project scaffolding.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const ressuKubePlex = projectIn(forksKubernetesGroup, "ressu-kube-plex", {
// 	description: "Scalable Plex Media Server on Kubernetes -- dispatch transcode jobs as pods on your cluster!",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const smarterDeviceManager = projectIn(forksKubernetesGroup, "smarter-device-manager", {
// 	description: "Enables k8s containers to access devices (linux device drivers) available on nodes",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const cloudProviderProxmox = projectIn(forksProxmoxGroup, "cloud-provider-proxmox", {
// 	description: "Kubernetes Cloud Provider for Proxmox VE",
// });

// // Fork — provider-discovery convention (clusterctl/registry). Never rename.
// export const clusterApiProviderProxmox = projectIn(forksProxmoxGroup, "cluster-api-provider-proxmox", {
// 	description: "Cluster API provider implementation for Proxmox VE",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const proxmoxGo = projectIn(forksProxmoxGroup, "proxmox-go", {
// 	description: "Go client package for the Proxmox VE REST API",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const pulumiProxmoxve = projectIn(forksProxmoxGroup, "pulumi-proxmoxve", {
// 	description: "A Pulumi provider for creating and managing Proxmox VE resources",
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

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const nixpkgs = projectIn(forksNixGroup, "nixpkgs", {
// 	description: "Nix Packages collection & NixOS",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const gomod2nix = projectIn(forksNixGroup, "gomod2nix", {
// 	description: "Convert applications using go modules to nix",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const nix2container = projectIn(forksNixGroup, "nix2container", {
// 	description: "An archive format for container images",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const nil = projectIn(forksMiscGroup, "nil", {
// 	description: "NIx Language server, an incremental analysis assistant for writing in Nix.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const goGithubMock = projectIn(forksMiscGroup, "go-github-mock", {
// 	description: "A library to aid unittesting code that uses Golang's Github SDK",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const mage = projectIn(forksMiscGroup, "mage", {
// 	description: "Magic Another Game Engine",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const testcontainersNode = projectIn(forksMiscGroup, "testcontainers-node", {
// 	description: "Testcontainers is a NodeJS library that supports tests, providing lightweight, throwaway instances of common databases, Selenium web browsers, or anything else that can run in a Docker container.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const azureFunctionsNodejsLibrary = projectIn(forksMiscGroup, "azure-functions-nodejs-library", {
// 	description: "The Node.js framework for Azure Functions",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const akkaBootcamp = projectIn(forksMiscGroup, "akka-bootcamp", {
// 	description: "Self-paced training course to learn Akka.NET fundamentals from scratch",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const prowlarr = projectIn(forksMiscGroup, "Prowlarr", {
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const bitnamiCharts = projectIn(forksMiscGroup, "bitnami-charts", {
// 	description: "Bitnami Helm Charts",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const bitnamiContainers = projectIn(forksMiscGroup, "bitnami-containers", {
// 	description: "Bitnami container images",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const openapiGenerator = projectIn(forksMiscGroup, "openapi-generator", {
// 	description: "OpenAPI Generator allows generation of API client libraries (SDK generation), server stubs, documentation and configuration automatically given an OpenAPI Spec (v2, v3)",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const gitkraken = projectIn(forksMiscGroup, "gitkraken", {
// 	description: "Arch User Repository Gitkraken",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const mediabox = projectIn(forksMiscGroup, "mediabox", {
// 	description: "Container based media tools configuration",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const portainerNordDarkTheme = projectIn(forksMiscGroup, "portainer-nord-dark-theme", {
// 	description: "Dark blue theme for Portainer, partly based on the Nord color palette.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const dockerfiles = projectIn(forksMiscGroup, "dockerfiles", {
// 	description: "Dockerfiles: Check_Mk, Couchpotato, Deluge, Gollum, Headphones, Lazy Librarian, OpenVPN PIA client, Plex, Sabnzbd, Samba, SSH Socks Proxy server, Sickrage, Syncthing, Stringer and Transmission.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const ocamlProtocPlugin = projectIn(forksMiscGroup, "ocaml-protoc-plugin", {
// 	description: "Plugin for Google's protobuf compiler to generate interfaces based on protobuf specifications and runtime for encoding and decoding protobuf messages",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const ryankurtePki = projectIn(forksMiscGroup, "ryankurte-pki", {
// 	description: "A simple PKI / certificate authority helper",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const skopeo = projectIn(forksMiscGroup, "skopeo", {
// 	description: "Work with remote images registries - retrieving information, images, signing content",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const unstoppableMangoGithubIo = projectIn(forksMiscGroup, "UnstoppableMango.github.io", {
// 	description: "Build a Jekyll blog in minutes, without touching the command line.",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const grpcDotnet = projectIn(forksMiscGroup, "grpc-dotnet", {
// 	description: "gRPC for .NET",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const utf8Json = projectIn(forksMiscGroup, "Utf8Json", {
// 	description: "Definitely Fastest and Zero Allocation JSON Serializer for C#(NET, .NET Core, Unity, Xamarin).",
// });

// // Fork — name matches upstream exactly. Never rename (breaks git remote, forkctl tracking, upstream PR history).
// export const fSharpGrpcCodeGenerator = projectIn(forksMiscGroup, "FSharp.GrpcCodeGenerator", {
// 	description: "A protoc plugin to enable generation of F# code + supporting libraries",
// });
