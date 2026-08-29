import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const goreleaserGroup = subgroup("goreleaser", rootGroup, {
	path: "goreleaser",
	description: "Converters that read GoReleaser projects.",
});
