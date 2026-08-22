import { projectIn } from "../util";
import { applicationsGroup } from "../groups";

export const minecraftManager = projectIn(applicationsGroup, "minecraft-manager", {
	description: "Visual management tool for deploying Minecraft servers across various platforms",
});

export const johnstonDemsMailer = projectIn(applicationsGroup, "johnston-dems-mailer", {
	description: "Johnston Democrats mailing application",
	visibility: "private",
});

export const slackerBot = projectIn(applicationsGroup, "slacker-bot", {
	description: "A Discord bot for the Slackers",
});

// Verify nothing references the image name before ever dropping -docker.
export const xmageDocker = projectIn(applicationsGroup, "xmage-docker", {
});

export const mangoMtg = projectIn(applicationsGroup, "mango-mtg", {
	description: "Digital Magic: The Gathering",
});

export const ouranosis = projectIn(applicationsGroup, "ouranosis", {
	description: "A game-ish kinda thing",
});

export const palumiWorld = projectIn(applicationsGroup, "palumi-world", {
	description: "My Palworld install",
});

export const auctionApp = projectIn(applicationsGroup, "auction-app", {
	description: "auction-app",
});
