import { projectIn } from "../../util";
import { goreleaserGroup } from "./group";

export { goreleaserGroup };

export const goreleaser2nix = projectIn(goreleaserGroup, "goreleaser2nix", {
	name: "2nix",
	description: "Convert GoReleaser projects to Nix derivations",
});
