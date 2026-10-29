import { projectIn } from "../../util";
import { nugetGroup } from "./group";

export { nugetGroup };

export const nuget2json = projectIn(nugetGroup, "nuget2json", {
	name: "2json",
	description:
		"Write a NuGet lock for Nix's buildDotnetModule without needing Nix",
});
