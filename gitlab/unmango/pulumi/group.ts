import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const pulumiGroup = subgroup("pulumi", rootGroup, {
	path: "pulumi",
	description: "Own Pulumi providers, components, and the IaC repos that drive them.",
});
