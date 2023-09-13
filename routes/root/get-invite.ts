import codes from "../../lib/codes.ts";
import di from "../../lib/di.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /invite/:invite"({ params: { invite } }) {
        const req = await di(`!GET /invite/${encodeURIComponent(invite)}`);
        if (!req.ok) throw [400, codes.INVALID_INVITE, "The provided invite was invalid."];
        return await req.json();
    },
} as RouteMap;
