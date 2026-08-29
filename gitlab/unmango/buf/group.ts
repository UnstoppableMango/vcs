import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const bufGroup = subgroup("buf", rootGroup, {
	path: "buf",
	description: "Converters that read Buf modules.",
});
