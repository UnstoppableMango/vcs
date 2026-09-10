import { projectIn } from "../../util";
import { dockerGroup } from "./group";

export { dockerGroup };

export const docker2nix = projectIn(dockerGroup, "docker2nix", {
	name: "2nix",
	description: "Converts Docker images to Nix expressions",
});
