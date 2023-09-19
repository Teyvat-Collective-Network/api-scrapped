import testData from "../tests/testData.js";
import logger from "./logger.js";
import query from "./query.js";

async function setup(table: string, string: string) {
    await query(`CREATE TABLE ${table} (${string})`)
        .then(() => logger.debug(`[DB] Created table '${table}'`))
        .catch((error) =>
            error.code === "ER_TABLE_EXISTS_ERROR" ? logger.debug(`[DB] Table '${table}' exists`) : logger.error(error, `[DB] Error creating table '${table}`),
        );
}

await setup(
    "invalidations",
    `
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        invalidated BIGINT NOT NULL
    `,
);

await setup(
    "users",
    `
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        observer BOOLEAN NOT NULL DEFAULT false
    `,
);

await setup(
    "roles",
    `
        id VARCHAR(32) NOT NULL PRIMARY KEY,
        description VARCHAR(2048) NOT NULL,
        assignment VARCHAR(32) NOT NULL
    `,
);

await setup(
    "characters",
    `
        id VARCHAR(32) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        short VARCHAR(255)
    `,
);

await setup(
    "attributes",
    `
        type VARCHAR(32) NOT NULL,
        id VARCHAR(32) NOT NULL,
        name VARCHAR(64) NOT NULL,
        emoji VARCHAR(64),
        PRIMARY KEY (type, id)
    `,
);

await setup(
    "character_attributes",
    `
        \`character\` VARCHAR(32) NOT NULL,
        type VARCHAR(32) NOT NULL,
        value VARCHAR(32) NOT NULL,
        PRIMARY KEY (\`character\`, type),
        FOREIGN KEY (\`character\`) REFERENCES characters(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (type, value) REFERENCES attributes(type, id) ON UPDATE CASCADE ON DELETE CASCADE
    `,
);

await setup(
    "guilds",
    `
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        name VARCHAR(32) NOT NULL,
        mascot VARCHAR(32) NOT NULL,
        invite VARCHAR(32) NOT NULL,
        owner VARCHAR(20) NOT NULL,
        advisor VARCHAR(20),
        delegated BOOLEAN NOT NULL DEFAULT false,
        FOREIGN KEY (mascot) REFERENCES characters(id) ON UPDATE CASCADE,
        FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advisor) REFERENCES users(id) ON DELETE CASCADE
    `,
);

await setup(
    "guild_roles",
    `
        user VARCHAR(20) NOT NULL,
        guild VARCHAR(20) NOT NULL,
        role VARCHAR(32) NOT NULL,
        PRIMARY KEY (user, guild, role),
        FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE,
        FOREIGN KEY (role) REFERENCES roles(id) ON DELETE CASCADE
    `,
);

await setup(
    "global_roles",
    `
        user VARCHAR(20) NOT NULL,
        role VARCHAR(32) NOT NULL,
        PRIMARY KEY (user, role),
        FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role) REFERENCES roles(id) ON DELETE CASCADE
    `,
);

await setup(
    "guild_staff",
    `
        user VARCHAR(20) NOT NULL,
        guild VARCHAR(20) NOT NULL,
        PRIMARY KEY (user, guild),
        FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE
    `,
);

await setup(
    "events",
    `
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner VARCHAR(20) NOT NULL,
        start BIGINT NOT NULL,
        end BIGINT NOT NULL,
        title VARCHAR(100) NOT NULL,
        body VARCHAR(4096) NOT NULL,
        FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE
    `,
);

await setup(
    "event_invites",
    `
        event INT NOT NULL,
        code VARCHAR(32) NOT NULL,
        UNIQUE (event, code),
        FOREIGN KEY (event) REFERENCES events(id) ON DELETE CASCADE
    `,
);

await setup(
    "banshares",
    `
        message VARCHAR(20) PRIMARY KEY,
        status VARCHAR(16) NOT NULL,
        urgent BOOLEAN NOT NULL,
        created BIGINT NOT NULL,
        reminded BIGINT NOT NULL
    `,
);

await setup(
    "banshare_ids",
    `
        banshare VARCHAR(20) NOT NULL,
        id VARCHAR(20) NOT NULL,
        PRIMARY KEY (banshare, id),
        FOREIGN KEY (banshare) REFERENCES banshares(message) ON DELETE CASCADE
    `,
);

await setup(
    "banshare_subscribers",
    `
        guild VARCHAR(20) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        PRIMARY KEY (guild),
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE
    `,
);

await setup(
    "banshare_logs",
    `
        guild VARCHAR(20) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        PRIMARY KEY (guild, channel),
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE
    `,
);

await setup(
    "banshare_settings",
    `
        guild VARCHAR(20) PRIMARY KEY,
        blockdms BOOLEAN NOT NULL DEFAULT FALSE,
        nobutton BOOLEAN NOT NULL DEFAULT FALSE,
        daedalus BOOLEAN NOT NULL DEFAULT FALSE,
        autoban INT NOT NULL DEFAULT 0,
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE
    `,
);

await setup(
    "banshare_executions",
    `
        banshare VARCHAR(20) NOT NULL,
        guild VARCHAR(20) NOT NULL,
        PRIMARY KEY (banshare, guild),
        FOREIGN KEY (banshare) REFERENCES banshares(message) ON DELETE CASCADE,
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE
    `,
);

await setup(
    "banshare_crossposts",
    `
        banshare VARCHAR(20) NOT NULL,
        guild VARCHAR(20) NOT NULL,
        url VARCHAR(128) NOT NULL,
        PRIMARY KEY (banshare, guild),
        FOREIGN KEY (banshare) REFERENCES banshares(message) ON DELETE CASCADE,
        FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE CASCADE
    `,
);

await query(`INSERT INTO users VALUES (?, true) ON DUPLICATE KEY UPDATE observer = true`, [Bun.env.ADMIN]);

logger.debug("[DB] Initialized root admin");

await query(
    `INSERT INTO roles VALUES
        ("staff",     "Staff of a TCN guild",                 "pseudo"),
        ("observer",  "TCN observer (administrator)",         "pseudo"),
        ("owner",     "Server Owners of TCN guilds",          "pseudo"),
        ("advisor",   "Council Advisors of TCN guilds",       "pseudo"),
        ("voter",     "Designated voters on the TCN council", "pseudo"),
        ("council",   "TCN Council Members",                  "pseudo")
    ON DUPLICATE KEY UPDATE id = id`,
);

logger.debug("[DB] Initialized base roles");

if (Bun.env.DEBUG) {
    await query(
        `INSERT INTO roles VALUES
            ("banshares", "Permission to submit banshares", "guild" ),
            ("developer", "Verified TCN developer",         "global")
        ON DUPLICATE KEY UPDATE id = id`,
    );

    await query(`INSERT INTO users VALUES (?, true) ON DUPLICATE KEY UPDATE id = id`, [testData.ADMIN_2]);
    await query(`INSERT INTO characters VALUES ? ON DUPLICATE KEY UPDATE id = id`, [testData.CHARACTERS]);
    await query(`INSERT INTO attributes VALUES ? ON DUPLICATE KEY UPDATE id = id`, [testData.ATTRS.map((x) => [x.type, x.id, x.name, x.emoji])]);
    await query(`INSERT INTO guilds VALUES (?, "Test Guild", ?, ?, ?, ?, DEFAULT) ON DUPLICATE KEY UPDATE id = id`, [
        testData.GUILD.id,
        testData.GUILD.mascot,
        testData.GUILD.invite,
        Bun.env.ADMIN,
        testData.ADMIN_2,
    ]);

    logger.debug("[DB] Initialized debug data");
}
