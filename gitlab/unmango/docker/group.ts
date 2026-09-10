import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const dockerGroup = subgroup("docker", rootGroup, {
	path: "docker",
	description: "Converters that read Docker images.",
});
