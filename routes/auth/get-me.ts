import { getUser } from "../../lib/db.js";
import { RouteMap } from "../../types.js";

export default {
    async "* GET /auth/me"({ user }) {
        return await getUser(user.id);
    },
} as RouteMap;
