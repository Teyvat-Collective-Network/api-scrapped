import codes from "../../lib/codes.ts";
import { ensureUser, getGuild, hasCharacter, hasGuild } from "../../lib/db.ts";
import di from "../../lib/di.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /guilds/:guildId"({ params: { guildId }, body, user }) {
        if (!user.observer) throw 403;

        if (!(await hasGuild(guildId))) throw [404, codes.MISSING_GUILD, `No guild exists with ID ${guildId}.`];

        const guild = await getGuild(guildId);

        if (body.advisor === null || (body.advisor === undefined && !guild.advisor)) {
            if (body.delegated) throw [400, codes.DELEGATED_WITHOUT_ADVISOR, "Delegation is only possible if an advisor exists."];
            body.delegated = false;
        }

        if (body.mascot !== undefined && !(await hasCharacter(body.mascot)))
            throw [400, codes.MISSING_CHARACTER, `The character ${body.mascot} does not exist.`];

        let code: string | undefined = undefined;

        if (body.invite) {
            const req = await di(`!GET /invite/${encodeURIComponent(body.invite)}`);
            if (!req.ok) throw [400, codes.INVALID_INVITE, "The invite does not exist."];

            const res = await req.json();
            if (res.guild.id !== guildId) throw [400, codes.INVALID_INVITE, "The invite points to the wrong guild."];
            if (res.maxAge) throw [400, codes.INVALID_INVITE, "The invite is not permanent."];
            if (res.guild.vanityURLCode === res.code) throw [400, codes.INVALID_INVITE, "The invite is a vanity URL."];
            if (res.targetUser || res.targetApplication || res.stageInstance || res.guildScheduledEvent)
                throw [400, codes.INVALID_INVITE, "The invite points to a user, application, stage channel, or event instead of the guild."];

            code = res.code;
        }

        if (body.owner) await ensureUser(body.owner);
        if (body.advisor) await ensureUser(body.advisor);

        const set = [];
        const values = [];

        for (const key of ["name", "mascot", "invite", "owner", "advisor", "delegated"]) {
            const value = key === "invite" ? code : body[key];
            if (value === undefined) continue;

            set.push(`${key} = ?`);
            values.push(value);
        }

        if (set.length > 0) await query(`UPDATE guilds SET ${set.join(", ")} WHERE id = ?`, [...values, guildId]);

        return await getGuild(guildId);
    },
} as RouteMap;
