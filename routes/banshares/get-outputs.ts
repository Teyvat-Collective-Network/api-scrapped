import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /banshares/outputs"() {
        return [
            { channel: Bun.env.HUB_BANSHARES, blockdms: 0, nobutton: 1, daedalus: 0, autoban: 0 },
            ...(await query(
                `SELECT subs.channel, settings.blockdms, settings.nobutton, settings.daedalus, settings.autoban FROM banshare_subscribers AS subs LEFT JOIN banshare_settings AS settings ON subs.guild = settings.guild`,
            )),
        ];
    },
} as RouteMap;
