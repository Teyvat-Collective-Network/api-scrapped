import Ajv from "ajv";
import compile from "./compile.ts";
import { base, spec } from "./lib/types.ts";

const ajv = new Ajv({ removeAdditional: true, coerceTypes: false });

const boolean = { type: "boolean" };
const string = { type: "string" };
const snowflake = { type: "string", pattern: "^\\d+$", minLength: 17, maxLength: 20 };
const id = { type: "string", pattern: "^[a-z-]+$", minLength: 1, maxLength: 32 };

const data: Record<string, spec> = Object.entries({
    "test POST /query": {},
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
    "* GET /tag/:userId": { auth: true, schema: { params: { type: "object", properties: { userId: snowflake } } } },
    "* GET /invite/:invite": { schema: { params: { type: "object", properties: { invite: string } } } },
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
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: id } } },
    },
    "* DELETE /users/:userId/roles/:roleId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: id } } },
    },
    "* PUT /users/:userId/roles/:roleId/:guildId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: id, guildId: snowflake } } },
    },
    "* DELETE /users/:userId/roles/:roleId/:guildId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { userId: snowflake, roleId: id, guildId: snowflake } } },
    },
    "* PUT /staff/:guildId/:userId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { guildId: snowflake, userId: snowflake } } },
    },
    "* DELETE /staff/:guildId/:userId": {
        auth: true,
        scope: "users/write",
        schema: { params: { type: "object", properties: { guildId: snowflake, userId: snowflake } } },
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
                    mascot: id,
                    invite: string,
                    owner: snowflake,
                    advisor: { oneOf: [snowflake, { type: "null" }] },
                    delegated: boolean,
                },
                required: ["name", "mascot", "invite", "owner", "advisor", "delegated"],
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
                    mascot: id,
                    invite: string,
                    owner: snowflake,
                    advisor: { oneOf: [snowflake, { type: "null" }] },
                    delegated: boolean,
                },
            },
        },
    },
    "* DELETE /guilds/:guildId": { auth: true, scope: "guilds/delete", schema: { params: { type: "object", properties: { guildId: snowflake } } } },
    "* GET /roles": {},
    "* GET /roles/:roleId": { schema: { params: { type: "object", properties: { roleId: id } } } },
    "* POST /roles/:roleId": {
        auth: true,
        scope: "roles/write",
        schema: {
            params: { type: "object", properties: { roleId: id } },
            body: {
                type: "object",
                properties: { description: { type: "string", minLength: 1, maxLength: 256 }, assignment: { enum: ["pseudo", "global", "guild", "all"] } },
                required: ["description"],
            },
        },
    },
    "* PATCH /roles/:roleId": {
        auth: true,
        scope: "roles/write",
        schema: {
            params: { type: "object", properties: { roleId: id } },
            body: { type: "object", properties: { description: { type: "string", minLength: 1, maxLength: 256 } } },
        },
    },
    "* DELETE /roles/:roleId": { auth: true, scope: "roles/delete", schema: { params: { type: "object", properties: { roleId: id } } } },
    "* GET /attributes": {},
    "* GET /attributes/:type/:id": { schema: { params: { type: "object", properties: { type: id, id } } } },
    "* POST /attributes/:type/:id": {
        auth: true,
        scope: "attributes/write",
        schema: {
            params: { type: "object", properties: { type: id, id } },
            body: {
                type: "object",
                properties: { name: { type: "string", minLength: 1, maxLength: 64 }, emoji: { type: "string", maxLength: 64 } },
                required: ["name", "emoji"],
            },
        },
    },
    "* PATCH /attributes/:type/:id": {
        auth: true,
        scope: "attributes/write",
        schema: {
            params: { type: "object", properties: { type: id, id } },
            body: {
                type: "object",
                properties: { id, name: { type: "string", minLength: 1, maxLength: 64 }, emoji: { type: "string", maxLength: 64 } },
            },
        },
    },
    "* DELETE /attributes/:type/:id": { auth: true, scope: "attributes/delete", schema: { params: { type: "object", properties: { type: id, id } } } },
    "* GET /characters": {},
    "* GET /characters/:id": { schema: { params: { type: "object", properties: { id } } } },
    "* POST /characters/:id": {
        auth: true,
        scope: "characters/write",
        schema: {
            params: { type: "object", properties: { id } },
            body: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 255 },
                    short: { type: "string", minLength: 1, maxLength: 255 },
                    attributes: { type: "object", additionalProperties: id },
                },
                required: ["name"],
            },
        },
    },
    "* PATCH /characters/:id": {
        auth: true,
        scope: "characters/write",
        schema: {
            params: { type: "object", properties: { id } },
            body: {
                type: "object",
                properties: {
                    id,
                    name: { type: "string", minLength: 1, maxLength: 255 },
                    short: { oneOf: [{ type: "string", minLength: 1, maxLength: 255 }, { type: "null" }] },
                    attributes: { type: "object", additionalProperties: { oneOf: [id, { type: "null" }] } },
                },
            },
        },
    },
    "* DELETE /characters/:id": { auth: true, scope: "characters/delete", schema: { params: { type: "object", properties: { id } } } },
    "* GET /events": {},
    "* POST /events": {
        auth: true,
        scope: "calendar/write",
        schema: {
            body: {
                type: "object",
                properties: {
                    start: { type: "integer", minimum: 0 },
                    end: { type: "integer", minimum: 0 },
                    title: { type: "string", maxLength: 100 },
                    body: { type: "string", maxLength: 4096 },
                    invites: { type: "array", items: string },
                },
                required: ["start", "end", "title", "body", "invites"],
            },
        },
    },
    "* GET /events/:id": {},
    "* PUT /events/:id": {
        auth: true,
        scope: "calendar/write",
        schema: {
            body: {
                type: "object",
                properties: {
                    start: { type: "integer", minimum: 0 },
                    end: { type: "integer", minimum: 0 },
                    title: { type: "string", maxLength: 100 },
                    body: { type: "string", maxLength: 4096 },
                    invites: { type: "array", items: string },
                },
                required: ["start", "end", "title", "body", "invites"],
            },
        },
    },
    "* DELETE /events/:id": { auth: true, scope: "calendar/delete" },
} satisfies Record<string, base & { schema?: Record<string, any> }>).reduce(
    (o, [k, v]) => ({ ...o, [k]: { ...v, schema: v.schema && Object.entries(v.schema).reduce((o, [k, v]) => ({ ...o, [k]: ajv.compile(v) }), {}) } }),
    {},
);

export default compile(data) as Record<string, Record<string, Record<string, spec>>>;
