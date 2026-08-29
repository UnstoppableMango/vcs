import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const nixGroup = subgroup("nix", rootGroup, {
	path: "nix",
	description: "Converters that read Nix expressions.",
});
