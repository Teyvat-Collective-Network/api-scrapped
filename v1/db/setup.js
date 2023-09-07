import logger from "../../logger.js";
import query from "./query.js";

async function setup(table, string) {
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
        invalidated DATETIME NOT NULL
    `,
);

await setup(
    "users",
    `
        id VARCHAR(20) NOT NULL PRIMARY KEY
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
    "guilds",
    `
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        name VARCHAR(32) NOT NULL,
        \`character\` VARCHAR(32) NOT NULL,
        invite VARCHAR(32) NOT NULL,
        owner VARCHAR(20) NOT NULL,
        advisor VARCHAR(20),
        delegated BOOLEAN NOT NULL DEFAULT false,
        lastToggle DATETIME,
        allowance BIGINT NOT NULL DEFAULT 5184000000,
        FOREIGN KEY (\`character\`) REFERENCES characters(id),
        FOREIGN KEY (owner) REFERENCES users(id),
        FOREIGN KEY (advisor) REFERENCES users(id)
    `,
);

await setup(
    "guild_roles",
    `
        user VARCHAR(20) NOT NULL,
        guild VARCHAR(20) NOT NULL,
        role VARCHAR(32) NOT NULL,
        PRIMARY KEY (user, guild, role),
        FOREIGN KEY (user) REFERENCES users(id),
        FOREIGN KEY (guild) REFERENCES guilds(id),
        FOREIGN KEY (role) REFERENCES roles(id)
    `,
);

await setup(
    "global_roles",
    `
        user VARCHAR(20) NOT NULL,
        role VARCHAR(32) NOT NULL,
        PRIMARY KEY (user, role),
        FOREIGN KEY (user) REFERENCES users(id),
        FOREIGN KEY (role) REFERENCES roles(id)
    `,
);

await query(`INSERT INTO users VALUES (?) ON DUPLICATE KEY UPDATE id = id`, [process.env.ADMIN]);
await query(`INSERT INTO roles VALUES (?, ?, "global"), ("staff", "Staff of a TCN guild", "all") ON DUPLICATE KEY UPDATE id = id`, [
    process.env.ADMIN_ROLE,
    process.env.ADMIN_ROLE_DESCRIPTION,
]);
await query(`INSERT INTO global_roles VALUES (?, ?) ON DUPLICATE KEY UPDATE user = user`, [process.env.ADMIN, process.env.ADMIN_ROLE]);

logger.debug("[DB] Initialized root admin");
