import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const sqlGroup = subgroup("sql", rootGroup, {
	path: "sql",
	description: "Converters that read SQL.",
});
