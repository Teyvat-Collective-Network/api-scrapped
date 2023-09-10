import { getGuild } from "../../lib/db.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* GET /guilds/:guildId"({ params: { guildId } }) {
        return await getGuild(guildId);
    },
} as RouteMap;
