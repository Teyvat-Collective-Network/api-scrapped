import codes from "../../lib/codes.ts";
import { ensureUser, hasCharacter, hasGuild } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* POST /guilds/:guildId"({ params: { guildId }, body, user }) {
        if (!user.observer) throw 403;
        if (await hasGuild(guildId)) throw [409, codes.DUPLICATE, `A guild with ID ${guildId} already exists.`];

        if (body.delegated && !body.advisor) throw [400, codes.DELEGATED_WITHOUT_ADVISOR, "Delegation is only possible if an advisor is specified."];
        if (!(await hasCharacter(body.mascot))) throw [400, codes.MISSING_CHARACTER, `The character ${body.mascot} does not exist.`];

        const req = await di(`!GET /invite/${encodeURIComponent(body.invite)}`);
        if (!req.ok) throw [400, codes.INVALID_INVITE, "The invite does not exist."];

        const res = await req.json();
        if (res.guild.id !== guildId) throw [400, codes.INVALID_INVITE, "The invite points to the wrong guild."];
        if (res.maxAge) throw [400, codes.INVALID_INVITE, "The invite is not permanent."];
        if (res.guild.vanityURLCode === res.code) throw [400, codes.INVALID_INVITE, "The invite is a vanity URL."];
        if (res.targetUser || res.targetApplication || res.stageInstance || res.guildScheduledEvent)
            throw [400, codes.INVALID_INVITE, "The invite points to a user, application, stage channel, or event instead of the guild."];

        await ensureUser(body.owner);
        if (body.advisor) await ensureUser(body.advisor);

        try {
            await query(`INSERT INTO guilds VALUES (?)`, [[guildId, body.name, body.mascot, res.code, body.owner, body.advisor, body.delegated]]);
        } catch {
            throw [409, codes.DUPLICATE, `A guild with ID ${guildId} already exists.`];
        }
    },
} as RouteMap;
