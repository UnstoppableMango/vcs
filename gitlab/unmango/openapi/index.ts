import { projectIn } from "../../util";
import { openapiGroup } from "./group";

export { openapiGroup };

export const openapi2go = projectIn(openapiGroup, "openapi2go", {
	name: "2go",
	description: "Converts OpenAPI specifications to Go",
});

export const openapi2terraform = projectIn(openapiGroup, "openapi2terraform", {
	name: "2terraform",
	description: "Converts OpenAPI specifications to terraform providers",
});
