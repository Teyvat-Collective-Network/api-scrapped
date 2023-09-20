import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /autostaff/:guild"({ params: { guild } }) {
        const output: Record<string, string[]> = {};

        for (const { watch } of await query(`SELECT watch FROM autostaff WHERE guild = ?`, [guild]))
            output[watch] = (await query(`SELECT role FROM autostaff_roles WHERE watch = ?`, [watch])).map(({ role }: { role: string }) => role);

        return output;
    },
} as RouteMap;
