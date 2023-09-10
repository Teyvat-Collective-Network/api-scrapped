import codes from "../../lib/codes.js";
import { getGuild, hasGuild } from "../../lib/db.js";
import { RouteMap } from "../../lib/types.js";

export default {
    async "* GET /guilds/:guildId"({ params: { guildId } }) {
        if (!(await hasGuild(guildId))) throw [404, codes.MISSING_GUILD, `No guild exists with ID ${guildId}`];
        return await getGuild(guildId);
    },
} as RouteMap;
