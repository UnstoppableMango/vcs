import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const terraformGroup = subgroup("terraform", rootGroup, {
	path: "terraform",
	description: "Terraform providers.",
});
