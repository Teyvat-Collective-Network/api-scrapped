import { getUser } from "../../lib/db.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* GET /auth/me"({ user }) {
        return await getUser(user.id);
    },
} as RouteMap;
