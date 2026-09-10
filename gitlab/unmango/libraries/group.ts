import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const librariesGroup = subgroup("libraries", rootGroup, {
	path: "libraries",
	description: "Standalone libraries, grouped by ecosystem.",
});
