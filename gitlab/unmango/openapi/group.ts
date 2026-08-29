import { subgroup } from "../../util";
import { rootGroup } from "../group";

export const openapiGroup = subgroup("openapi", rootGroup, {
	path: "openapi",
	description: "Converters that read OpenAPI specifications.",
});
