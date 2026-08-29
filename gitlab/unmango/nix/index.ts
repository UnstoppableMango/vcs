import { projectIn } from "../../util";
import { nixGroup } from "./group";

export { nixGroup };

export const nix2git = projectIn(nixGroup, "nix2git", {
	name: "2git",
	description: "Converts Nix expressions to Git repositories",
});
