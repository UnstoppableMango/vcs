import { projectIn } from "../util";
import { personalGroup } from "../groups";

export const erik = projectIn(personalGroup, "erik", {
	description: "me",
	visibility: "private",
});

export const dotfiles = projectIn(personalGroup, "dotfiles", {
});

export const nixos = projectIn(personalGroup, "nixos", {
	description: "My NixOS source",
});

export const pki = projectIn(personalGroup, "pki", {
	description: "My private key infrastructure",
	visibility: "private",
});

export const resume = projectIn(personalGroup, "resume", {
	description: "My résumé, codified",
});

export const unstoppablemangoIo = projectIn(personalGroup, "unstoppablemango.io", {
	description: "A website about me for random garbage",
});

export const relationships = projectIn(personalGroup, "relationships", {
	description: "Relationships mesh",
	visibility: "private",
});

export const travel = projectIn(personalGroup, "travel", {
	description: "My adventures wandering the world",
});

export const jplNotes = projectIn(personalGroup, "jpl-notes", {
	visibility: "private",
});
