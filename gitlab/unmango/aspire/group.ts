import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const aspireGroup = subgroup("aspire", rootGroup, {
	path: "aspire",
	description: "Converters that read .NET Aspire projects.",
});
