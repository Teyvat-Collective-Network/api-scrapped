import { RouteMap } from "../../lib/types.js";

export default {
    async "* GET /auth/token"({ token }) {
        return token;
    },
} as RouteMap;
