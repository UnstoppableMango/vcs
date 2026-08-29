import { projectIn } from "../../util";
import { aspireGroup } from "./group";

export { aspireGroup };

export const aspire2nix = projectIn(aspireGroup, "aspire2nix", {
	name: "2nix",
	description: "Convert .NET Aspire projects to Nix derivations",
});
