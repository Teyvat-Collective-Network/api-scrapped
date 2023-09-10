import Ajv from "ajv";
import compile from "./compile.ts";
import { base, spec } from "./lib/types.ts";

const ajv = new Ajv({ removeAdditional: true, coerceTypes: false });

const boolean = { type: "boolean" };
const string = { type: "string" };
const snowflake = { type: "string", pattern: "^\\d+$", minLength: 17, maxLength: 20 };

const data: Record<string, spec> = Object.entries({
    "* GET /auth/key-info": { auth: true },
    "* GET /auth/token": { auth: true },
    "* GET /auth/me": { auth: true },
    "* POST /auth/invalidate": { auth: true },
    "* POST /auth/key": {
        auth: true,
        scope: "key",
        schema: {
            body: {
                type: "object",
                properties: { maxage: { type: "integer", minimum: 0 }, scopes: { type: "array", items: string } },
                required: ["maxage", "scopes"],
            },
        },
    },
    "* GET /stats": {},
    "* GET /users": {},
    "* GET /users/:userId": { schema: { params: { type: "object", properties: { userId: snowflake } } } },
    "* PATCH /users/:userId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake } }, body: { type: "object", properties: { observer: boolean } } },
    },
    "* PUT /users/:userId/roles/:roleId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: string } } },
    },
    "* DELETE /users/:userId/roles/:roleId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: string } } },
    },
    "* PUT /users/:userId/roles/:roleId/:guildId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: string, guildId: snowflake } } },
    },
    "* DELETE /users/:userId/roles/:roleId/:guildId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: string, guildId: snowflake } } },
    },
    "* GET /guilds": {},
    "* GET /guilds/:guildId": { schema: { params: { type: "object", properties: { guildId: snowflake } } } },
    "* POST /guilds/:guildId": {
        auth: true,
        scope: "guilds/write",
        schema: {
            params: { type: "object", properties: { guildId: snowflake } },
            body: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 32 },
                    mascot: string,
                    invite: string,
                    owner: snowflake,
                    advisor: snowflake,
                    delegated: boolean,
                },
                required: ["name", "mascot", "invite", "owner", "delegated"],
            },
        },
    },
    "* PATCH /guilds/:guildId": {
        auth: true,
        scope: "guilds/write",
        schema: {
            params: { type: "object", properties: { guildId: snowflake } },
            body: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 32 },
                    mascot: string,
                    invite: string,
                    owner: snowflake,
                    advisor: snowflake,
                    delegated: boolean,
                },
            },
        },
    },
    "* DELETE /guilds/:guildId": { auth: true, scope: "guilds/delete", schema: { params: { type: "object", properties: { guildId: snowflake } } } },
} satisfies Record<string, base & { schema?: Record<string, any> }>).reduce(
    (o, [k, v]) => ({ ...o, [k]: { ...v, schema: v.schema && Object.entries(v.schema).reduce((o, [k, v]) => ({ ...o, [k]: ajv.compile(v) }), {}) } }),
    {},
);

export default compile(data) as Record<string, Record<string, Record<string, spec>>>;