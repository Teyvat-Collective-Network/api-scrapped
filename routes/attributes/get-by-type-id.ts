import codes from "../../lib/codes.ts";
import { getAttribute, hasAttribute } from "../../lib/db.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /attributes/:type/:id"({ params: { type, id } }) {
        if (!(await hasAttribute(type, id))) throw [404, codes.MISSING_ATTRIBUTE, `No attribute exists with type ${type} and ID ${id}.`];
        return await getAttribute(type, id);
    },
} as RouteMap;
