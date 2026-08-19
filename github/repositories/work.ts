import { PublicRepo } from "../components";

export const kubernetesTheWrongWay = new PublicRepo(
	"kubernetes-the-wrong-way",
	{
		description: "A CRUD API using Kubernetes APIs",
		topics: ["kubernetes", "technically-speaking", "rest"],
	},
);

export const auctionApp = new PublicRepo("auction-app", {
	description: "auction-app",
});

export const openshiftLab = new PublicRepo("openshift-lab", {
	description: "Learning OpenShift by doing",
	topics: ["openshift", "kubernetes", "lab"],
});
