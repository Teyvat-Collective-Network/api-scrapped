import codes from "../../lib/codes.ts";
import { getGuild } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /banshares"({ body, user }) {
        const guild = user.guilds[body.server];
        if (!guild || !(guild.owner || guild.advisor || (guild.staff && guild.roles.includes("banshares"))))
            throw [403, codes.FORBIDDEN, "You do not have permission to submit banshares from that server."];

        if (!body.skipChecks && !body.ids.match(/^\s*(\d{17,20}\s+)*\d{17,20}\s*$/))
            throw [400, codes.INVALID_BANSHARE_DATA, "ID field must be a whitespace-separated list of user IDs."];

        if (!body.reason) throw [400, codes.INVALID_BANSHARE_DATA, "Reason is required."];
        if (body.reason.length > 498) throw [400, codes.INVALID_BANSHARE_DATA, "Reason must not exceed 498 characters."];

        if (!body.evidence) throw [400, codes.INVALID_BANSHARE_DATA, "Evidence is required."];
        if (body.evidence.length > 1000) throw [400, codes.INVALID_BANSHARE_DATA, "Evidence must not exceed 1000 characters."];

        if (!["P0", "P1", "P2", "DM"].includes(body.severity)) throw [400, codes.INVALID_BANSHARE_DATA, "Severity must be one of P0, P1, P2, or DM."];

        let idList: string[] = [];
        if (!body.skipChecks) body.idList = idList = body.ids.trim().split(/\s+/);
        if (idList.includes(user.id)) throw [400, codes.INVALID_BANSHARE_DATA, "You cannot banshare yourself."];
        body.author = user.id;
        body.serverName = (await getGuild(body.server)).name;

        const req = await di(`!POST /banshare`, body);
        const { message } = await req.json();
        if (req.status === 400) throw [400, codes.INVALID_BANSHARE_DATA, message];
        if (req.status === 500) throw [500, codes.INTERNAL_ERROR, "An unexpected error occurred."];

        await query(`INSERT INTO banshares VALUES (?)`, [[message, "pending", body.urgent, Date.now(), Date.now()]]);

        if (idList.length > 0) await query(`INSERT INTO banshare_ids VALUES ?`, [idList.map((id) => [message, id])]);

        return { id: message };
    },
} as RouteMap;
