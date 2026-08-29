import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const utilitiesGroup = subgroup("utilities", rootGroup, {
	path: "utilities",
	description: "Small standalone tools that don't belong to a bigger family.",
});
