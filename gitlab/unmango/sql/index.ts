import { projectIn } from "../../util";
import { sqlGroup } from "./group";

export { sqlGroup };

export const sql2csharp = projectIn(sqlGroup, "sql2csharp", {
	name: "2csharp",
	description: "Converts SQL into a C# representation",
});
