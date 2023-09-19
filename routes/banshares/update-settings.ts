import { hasGuild } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* PATCH /banshares/:guild/settings"({ params: { guild }, body }) {
        if (!(await hasGuild(guild))) throw 404;

        const set: { blockdms?: boolean; nobutton?: boolean; daedalus?: boolean; autoban?: number } = {};

        for (const key of ["blockdms", "nobutton", "daedalus", "autoban"] as const) {
            const value = body[key];
            if (value === undefined) continue;

            set[key] = value;
        }

        if (Object.keys(set).length > 0) {
            let string = "INSERT INTO banshare_settings VALUES (?";
            let params: any[] = [guild];

            for (const entry of [set.blockdms, set.nobutton, set.daedalus, set.autoban]) {
                if (entry !== undefined) {
                    string += ", ?";
                    params.push(entry);
                } else string += ", DEFAULT";
            }

            string += `) ON DUPLICATE KEY UPDATE ${Object.keys(set)
                .map((key) => `${key} = ?`)
                .join(", ")}`;

            params = [...params, ...Object.values(set)];

            await query(string, params);
        }

        const [data] = await query(`SELECT * FROM banshare_settings WHERE guild = ?`, [guild]);
        return data;
    },
} as RouteMap;
