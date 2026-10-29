import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const nugetGroup = subgroup("nuget", rootGroup, {
	path: "nuget",
	description: "Converters that read NuGet packages.",
});
