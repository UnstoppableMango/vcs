import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const workGroup = subgroup("work", rootGroup, {
	path: "work",
	description: "Client and employer-adjacent proof-of-concepts.",
});
