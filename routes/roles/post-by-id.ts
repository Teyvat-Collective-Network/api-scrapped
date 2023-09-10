import codes from "../../lib/codes.ts";
import { getRole, hasRole } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /roles/:roleId"({ params: { roleId }, body, user }) {
        if (!user.observer) throw 403;

        if (await hasRole(roleId)) throw [409, codes.DUPLICATE, `A role with ID ${roleId} already exists.`];
        if (body.assignment === "pseudo") throw [400, codes.INVALID_ROLE_TYPE, "Pseudo roles cannot be created through the API."];

        await query(`INSERT INTO roles VALUES (?)`, [[roleId, body.description, body.assignment]]);
    },
} as RouteMap;
