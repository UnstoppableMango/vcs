import { projectIn } from "../../util";
import { gossamerGroup } from "./group";

export { gossamerGroup };

export const gossamer2nix = projectIn(gossamerGroup, "gossamer2nix", {
	name: "2nix",
	description: "Convert Gossamer projects to Nix derivations",
});
