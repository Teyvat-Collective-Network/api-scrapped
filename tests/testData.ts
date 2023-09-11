export default {
    ADMIN_2: "239419113791815681",
    CHARACTERS: [
        ["shenhe", "Shenhe", null],
        ["sayu", "Sayu", null],
        ["kazuha", "Kaedehara Kazuha", "Kazuha"],
    ],
    GUILD: { id: "1074629783440326679", name: "Hyper Mains", mascot: "shenhe", invite: "RkYupQqdn2" },
    GUILD_2: { id: "1074629732521488434", name: "Leaf Mains", mascot: "sayu", invite: "yv2RS2q83V" },
    GUILD_3: { name: "Sans Mains", mascot: "kazuha", invite: "3EWdJcwGKc" },
    OTHER_INVITE: "FG2wpbywSx",
    ROLE: { id: "test-role", description: "Test Role", assignment: "all" },
    ROLE_2: { description: "Test Role V2" },
    ATTRS: [
        { type: "weapon", id: "sword", name: "Sword", emoji: "<:sword:1021232974848589864>" },
        { type: "weapon", id: "polearm", name: "Polearm", emoji: "<:polearm:1021233017055871006>" },
    ],
    ATTR_1: { type: "test-type", id: "sword", name: "Test Attribute", emoji: "..." },
    ATTR_2: { id: "test-id", name: "Test Attribute V2", emoji: "... V2" },
    CHAR_1: { name: "Character Name", short: "Char", attributes: { weapon: "sword" } },
    CHAR_2: { name: "Character Name V2", short: "Char 2", attributes: { weapon: "polearm" } },
} as const;
