import { getCharacter } from "../../lib/db.ts";
import query from "../../lib/query.ts";
import { RouteMap } from "../../lib/types.ts";

export default {
    async "* GET /partner-list"() {
        const guilds = await query(`SELECT * FROM guilds`);
        const attributes = await query(`SELECT * FROM attributes`);

        const groups: Record<string, string[]> = {};

        for (const guild of guilds) {
            const { mascot, invite } = guild;
            const char = await getCharacter(mascot);

            const emoji = char.attributes.element
                ? attributes.find((attr: any) => attr.type === "element" && attr.id === char.attributes.element)?.emoji ?? "?"
                : "?";

            (groups[emoji] ??= []).push(`- [${char.short || char.name}](https://discord.gg/${invite})`);
        }

        return {
            embeds: [
                { color: 0x2b2d31, image: { url: "https://i.imgur.com/sDdOtLU.png" } },
                {
                    title: "**Teyvat Collective Network**",
                    description:
                        '[teyvatcollective.network](https://teyvatcollective.network "the TCN website")\n\n_"In Teyvat, the stars in the sky will always have a place for you."_\n\nA network of high-quality Genshin Impact character-mains style servers that focus on creating fan communities. Within the network, individual and network-wide events are held such as: tournaments, scavenger hunts and other fun events, community nights, giveaways, and patch preview livestreams.',
                    color: 0x2b2d31,
                    fields: [
                        ...Object.entries(groups)
                            .sort(([, x], [, y]) => x.length - y.length)
                            .map(([name, list]) => ({ name, value: list.join("\n"), inline: true })),
                        ...new Array(3 - (Object.keys(groups).length % 3)).fill({ name: "_ _", value: "_ _", inline: true }),
                        {
                            name: "**TCN Hub**",
                            value: "Join us in the official TCN hub to ask questions about the network, talk to other network members, get information on the network and how to apply, and contact observers (admins)! https://discord.gg/FG2wpbywSx",
                        },
                        {
                            name: "**Genshin Wizard**",
                            value: "The TCN is partnered with [Genshin Wizard](https://genshinwizard.com/), a multipurpose Genshin Impact Discord bot with a wide array of features to let you view your in-game stats, flex your builds, view build guides and hundreds of high-quality infographics, and more!",
                        },
                        {
                            name: "**Genshin Impact Tavern**",
                            value: 'The TCN is partnered with [Genshin Impact Tavern](https://discord.gg/genshinimpacttavern), a multifaceted Discord Community Server hosting a custom bot designed to emulate an "RPG-like" experience. This includes the earning of Mora (Server digital currency), a Vision, farming for weapons and upgrades with continuously expanding systems related to each. Mora can be redeemed to make use of several server functions, including redemption for Official Merchandise. Genshin Impact Tavern is also the proud host of the Cat\'s Tail Gathering TCG Tournament! _Genshin Impact Tavern is an officially endorsed server._',
                        },
                    ],
                    image: { url: "https://i.imgur.com/U9Wqlug.png" },
                },
            ],
        };
    },
} as RouteMap;
