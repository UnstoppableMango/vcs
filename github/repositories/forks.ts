import { Fork, integrationIds, PublicRepo } from "../components";

export const nilFork = new Fork("nil", {
	sourceOwner: "oxalica",
	sourceRepo: "nil",
	repository: {
		description:
			"NIx Language server, an incremental analysis assistant for writing in Nix.",
	},
});

export const goGithubMock = new Fork("go-github-mock", {
	sourceOwner: "migueleliasweb",
	sourceRepo: "go-github-mock",
	repository: {
		description:
			"A library to aid unittesting code that uses Golang's Github SDK",
		hasIssues: true,
	},
});

export const mageFork = new Fork("mage", {
	sourceOwner: "magefree",
	sourceRepo: "mage",
	repository: {
		description: "Magic Another Game Engine",
		homepageUrl: "http://xmage.de",
	},
});

export const nixpkgs = new Fork("nixpkgs", {
	sourceOwner: "NixOS",
	sourceRepo: "nixpkgs",
	repository: {
		description: "Nix Packages collection & NixOS",
		hasProjects: false,
		hasWiki: false,
	},
});

export const testcontainersNode = new Fork("testcontainers-node", {
	sourceOwner: "testcontainers",
	sourceRepo: "testcontainers-node",
	repository: {
		description:
			"Testcontainers is a NodeJS library that supports tests, providing lightweight, throwaway instances of common databases, Selenium web browsers, or anything else that can run in a Docker container.",
		homepageUrl: "https://testcontainers.com",
	},
});

export const piholeKubernetes = new Fork("pihole-kubernetes", {
	sourceOwner: "MoJo2600",
	sourceRepo: "pihole-kubernetes",
	repository: {
		description: "PiHole on kubernetes",
		hasProjects: false,
		hasWiki: false,
	},
});

export const accountManagementAutomation = new Fork(
	"account-management-automation",
	{
		sourceOwner: "sourceallies",
		sourceRepo: "account-management-automation",
		repository: {
			description: "Github for Account Management Automation Hydra Project",
			hasProjects: false,
			hasWiki: false,
			visibility: "private",
		},
	},
);

export const azureFunctionsNodejsLibrary = new Fork(
	"azure-functions-nodejs-library",
	{
		sourceOwner: "Azure",
		sourceRepo: "azure-functions-nodejs-library",
		repository: {
			description: "The Node.js framework for Azure Functions",
			hasProjects: false,
			hasWiki: false,
			homepageUrl: "https://www.npmjs.com/package/@azure/functions",
		},
	},
);

export const pulumiFork = new Fork("pulumi", {
	sourceOwner: "pulumi",
	sourceRepo: "pulumi",
	repository: {
		description:
			"Pulumi - Infrastructure as Code in any programming language 🚀",
		homepageUrl: "https://www.pulumi.com",
	},
});

export const crd2pulumi = new Fork("crd2pulumi", {
	sourceOwner: "pulumi",
	sourceRepo: "crd2pulumi",
	repository: {
		description:
			"Generate typed CustomResources from a Kubernetes CustomResourceDefinition",
	},
});

export const smarterDeviceManager = new Fork("smarter-device-manager", {
	sourceOwner: "smarter-project",
	sourceRepo: "smarter-device-manager",
	repository: {
		description:
			"Enables k8s containers to access devices (linux device drivers) available on nodes",
	},
});

export const pulumiTalos = new Fork("pulumi-talos", {
	sourceOwner: "pulumiverse",
	sourceRepo: "pulumi-talos",
	repository: {
		description: "Pulumi provider for Talos",
	},
});

export const kubernetesWebsite = new Fork("kubernetes-website", {
	sourceOwner: "kubernetes",
	sourceRepo: "website",
	repository: {
		description: "Kubernetes website and documentation repo: ",
		homepageUrl: "https://kubernetes.io",
	},
});

export const cloudflareTunnelIngressController = new Fork(
	"cloudflare-tunnel-ingress-controller",
	{
		sourceOwner: "STRRL",
		sourceRepo: "cloudflare-tunnel-ingress-controller",
		repository: {
			description:
				"🚀 Expose the website directly into the internet! The Kuberntes Ingress Controller based on Cloudflare Tunnel.",
			deleteBranchOnMerge: true,
			hasProjects: false,
		},
	},
);

export const clusterApiProviderProxmox = new Fork(
	"cluster-api-provider-proxmox",
	{
		sourceOwner: "k8s-proxmox",
		sourceRepo: "cluster-api-provider-proxmox",
		repository: {
			description: "Cluster API provider implementation for Proxmox VE",
			allowMergeCommit: false,
			deleteBranchOnMerge: true,
			hasProjects: false,
			hasWiki: false,
		},
	},
);

export const grpcDotnet = new Fork("grpc-dotnet", {
	sourceOwner: "grpc",
	sourceRepo: "grpc-dotnet",
	repository: {
		description: "gRPC for .NET",
	},
});

export const openapiGenerator = new Fork("openapi-generator", {
	sourceOwner: "OpenAPITools",
	sourceRepo: "openapi-generator",
	repository: {
		description:
			"OpenAPI Generator allows generation of API client libraries (SDK generation), server stubs, documentation and configuration automatically given an OpenAPI Spec (v2, v3)",
		homepageUrl: "https://openapi-generator.tech",
	},
});

export const akkaBootcamp = new Fork("akka-bootcamp", {
	sourceOwner: "petabridge",
	sourceRepo: "akka-bootcamp",
	repository: {
		description:
			"Self-paced training course to learn Akka.NET fundamentals from scratch",
		homepageUrl: "http://learnakka.net/",
	},
});

export const k3os = new Fork("k3os", {
	sourceOwner: "rancher",
	sourceRepo: "k3os",
	repository: {
		description:
			"Purpose-built OS for Kubernetes, fully managed by Kubernetes.",
		hasWiki: false,
		homepageUrl: "https://k3os.io",
	},
});

export const pulumiKubernetesx = new Fork("pulumi-kubernetesx", {
	sourceOwner: "pulumi",
	sourceRepo: "pulumi-kubernetesx",
	repository: {
		description: "Kubernetes for Everyone",
		hasWiki: false,
	},
});

export const prowlarr = new Fork("Prowlarr", {
	sourceOwner: "Prowlarr",
	sourceRepo: "Prowlarr",
	repository: {
		hasWiki: false,
	},
});

export const clusterApiBootstrapProviderTalos = new Fork(
	"cluster-api-bootstrap-provider-talos",
	{
		sourceOwner: "siderolabs",
		sourceRepo: "cluster-api-bootstrap-provider-talos",
		repository: {
			description:
				"A cluster-api bootstrap provider for deploying Talos clusters.",
			homepageUrl: "https://www.talos-systems.com",
		},
	},
);

export const clusterApi = new Fork("cluster-api", {
	sourceOwner: "kubernetes-sigs",
	sourceRepo: "cluster-api",
	repository: {
		description: "Home for Cluster API, a subproject of sig-cluster-lifecycle",
		homepageUrl: "https://cluster-api.sigs.k8s.io",
	},
});

export const clusterApiProviderBringyourownhost = new Fork(
	"cluster-api-provider-bringyourownhost",
	{
		sourceOwner: "vmware-tanzu",
		sourceRepo: "cluster-api-provider-bringyourownhost",
		repository: {
			description:
				"Kubernetes Cluster API Provider BYOH for already-provisioned hosts running Linux.",
		},
	},
);

export const ressuKubePlex = new Fork("ressu-kube-plex", {
	sourceOwner: "ressu",
	sourceRepo: "kube-plex",
	repository: {
		description:
			"Scalable Plex Media Server on Kubernetes -- dispatch transcode jobs as pods on your cluster!",
	},
});

export const pulumiProxmoxve = new Fork("pulumi-proxmoxve", {
	sourceOwner: "muhlba91",
	sourceRepo: "pulumi-proxmoxve",
	repository: {
		description:
			"A Pulumi provider for creating and managing Proxmox VE resources",
		hasWiki: false,
	},
});

export const bitnamiCharts = new Fork("bitnami-charts", {
	sourceOwner: "bitnami",
	sourceRepo: "charts",
	repository: {
		description: "Bitnami Helm Charts",
		hasWiki: false,
		homepageUrl: "https://bitnami.com",
	},
});

export const bitnamiContainers = new Fork("bitnami-containers", {
	sourceOwner: "bitnami",
	sourceRepo: "containers",
	repository: {
		description: "Bitnami container images",
		hasWiki: false,
		homepageUrl: "https://bitnami.com",
	},
});

export const pulumiTemplates = new Fork("pulumi-templates", {
	sourceOwner: "pulumi",
	sourceRepo: "templates",
	repository: {
		description: "Templates used by `pulumi new`",
	},
});

export const qemuGuestAgentTalos = new Fork("qemu-guest-agent-talos", {
	sourceOwner: "crisobal",
	sourceRepo: "qemu-guest-agent-talos",
	repository: {
		description:
			"Run the qemu guest agent as daemonset on talos. Good for proxmox as it uses the guest agent to shutdown and reboot hosts.",
	},
});

export const clusterApiControlPlaneProviderTalos = new Fork(
	"cluster-api-control-plane-provider-talos",
	{
		sourceOwner: "siderolabs",
		sourceRepo: "cluster-api-control-plane-provider-talos",
		repository: {
			description: "A control plane provider for CAPI + Talos",
		},
	},
);

export const cloudProviderProxmox = new Fork("cloud-provider-proxmox", {
	sourceOwner: "k8s-proxmox",
	sourceRepo: "cloud-provider-proxmox",
	repository: {
		description: "Kubernetes Cloud Provider for Proxmox VE",
	},
});

export const proxmoxGo = new Fork("proxmox-go", {
	sourceOwner: "k8s-proxmox",
	sourceRepo: "proxmox-go",
	repository: {
		description: "Go client package for the Proxmox VE REST API",
	},
});

export const kubeletServingCertApprover = new Fork(
	"kubelet-serving-cert-approver",
	{
		sourceOwner: "alex1989hu",
		sourceRepo: "kubelet-serving-cert-approver",
		repository: {
			description: "Kubelet Serving TLS Certificate Signing Request Approver",
			hasWiki: false,
		},
	},
);

export const fsharpGrpcCodeGenerator = new Fork("FSharp.GrpcCodeGenerator", {
	sourceOwner: "Arshia001",
	sourceRepo: "FSharp.GrpcCodeGenerator",
	repository: {
		description:
			"A protoc plugin to enable generation of F# code + supporting libraries",
	},
});

export const gitkraken = new Fork("gitkraken", {
	sourceOwner: "Azd325",
	sourceRepo: "gitkraken",
	repository: {
		description: "Arch User Repository Gitkraken",
		hasWiki: false,
		homepageUrl: "https://aur.archlinux.org/packages/gitkraken/",
	},
});

export const gomod2nix = new Fork("gomod2nix", {
	sourceOwner: "nix-community",
	sourceRepo: "gomod2nix",
	repository: {
		description: "Convert applications using go modules to nix",
	},
});

export const operatorSdk = new Fork("operator-sdk", {
	sourceOwner: "operator-framework",
	sourceRepo: "operator-sdk",
	repository: {
		description:
			"SDK for building Kubernetes applications. Provides high level APIs, useful abstractions, and project scaffolding.",
		homepageUrl: "https://sdk.operatorframework.io",
	},
});

export const mediabox = new Fork("mediabox", {
	sourceOwner: "tom472",
	sourceRepo: "mediabox",
	repository: {
		description: "Container based media tools configuration",
	},
});

export const portainerNordDarkTheme = new Fork("portainer-nord-dark-theme", {
	sourceOwner: "jscottelblein",
	sourceRepo: "portainer-nord-dark-theme",
	repository: {
		description:
			"Dark blue theme for Portainer, partly based on the Nord color palette.",
	},
});

export const utf8Json = new Fork("Utf8Json", {
	sourceOwner: "neuecc",
	sourceRepo: "Utf8Json",
	repository: {
		description:
			"Definitely Fastest and Zero Allocation JSON Serializer for C#(NET, .NET Core, Unity, Xamarin).",
	},
});

export const dockerfilesFork = new Fork("dockerfiles", {
	sourceOwner: "firecat53",
	sourceRepo: "dockerfiles",
	repository: {
		description:
			"Dockerfiles: Check_Mk, Couchpotato, Deluge, Gollum, Headphones, Lazy Librarian, OpenVPN PIA client, Plex, Sabnzbd, Samba, SSH Socks Proxy server, Sickrage, Syncthing, Stringer and Transmission.",
	},
});

export const ocamlProtocPlugin = new Fork("ocaml-protoc-plugin", {
	sourceOwner: "andersfugmann",
	sourceRepo: "ocaml-protoc-plugin",
	repository: {
		description:
			"Plugin for Google's protobuf compiler to generate interfaces based on protobuf specifications and runtime for encoding and decoding protobuf messages",
	},
});

export const nix2container = new Fork("nix2container", {
	sourceOwner: "nlewo",
	sourceRepo: "nix2container",
	repository: {
		description: "An archive format for container images",
	},
});

export const ryankurtePki = new Fork("ryankurte-pki", {
	sourceOwner: "ryankurte",
	sourceRepo: "pki",
	repository: {
		description: "A simple PKI / certificate authority helper",
	},
});

export const skopeo = new Fork("skopeo", {
	sourceOwner: "podman-container-tools",
	sourceRepo: "skopeo",
	repository: {
		description:
			"Work with remote images registries - retrieving information, images, signing content",
	},
});

export const forks = new PublicRepo("forks", {
	description: "My fork maintenance automation",
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});

export const unstoppableMangoGithubIo = new Fork("UnstoppableMango.github.io", {
	sourceOwner: "barryclark",
	sourceRepo: "jekyll-now",
	repository: {
		description:
			"Build a Jekyll blog in minutes, without touching the command line.",
	},
});
