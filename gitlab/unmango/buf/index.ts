import { projectIn } from "../../util";
import { bufGroup } from "./group";

export { bufGroup };

export const buf2nix = projectIn(bufGroup, "buf2nix", {
	name: "2nix",
	description: "Convert Buf modules to Nix derivations",
});
