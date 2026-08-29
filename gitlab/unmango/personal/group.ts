import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const personalGroup = subgroup("personal", rootGroup, {
	path: "personal",
	description: "Identity, personal config, and one-off life admin.",
});
