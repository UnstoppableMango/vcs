import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const gossamerGroup = subgroup("gossamer", rootGroup, {
	path: "gossamer",
	description: "Converters that read Gossamer projects.",
});
