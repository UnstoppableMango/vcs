import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const operatorsGroup = subgroup("operators", rootGroup, {
	path: "operators",
	description: "Custom Kubernetes controllers/operators for self-hosted services.",
});
