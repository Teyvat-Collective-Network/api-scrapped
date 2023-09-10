import { describe, expect, test } from "bun:test";
import codes from "../../lib/codes.ts";
import api from "../api.ts";
import testData from "../testData.ts";
import { expectError, forge, forgeAdmin, randomId, test401 } from "../utils.ts";

describe("GET /auth/key-info", () => {
    const route = `GET /v1/auth/key-info`;

    test401(route);

    test("returns correct info", async () => {
        const id = randomId();
        const expires = Date.now() + 1000;
        const scopes = ["scope 1", "scope 2"];

        const res = await api(forge(id, { expires, scopes }), route);

        expect(res.id).toBe(id);
        expect(res.expiresAt).toBe(expires);
        expect(res.expiresIn).toBeLessThanOrEqual(1000);
        expect(res.scopes).toEqual(scopes);
    });
});

describe("GET /auth/token", () => {
    const route = `GET /v1/auth/token`;

    test401(route);

    test("returns token", async () => {
        const token = forge(randomId());

        const req = await api(token, `!${route}`);
        const key = await req.text();

        expect(key).toBe(token);
    });
});

describe("GET /auth/me", () => {
    const route = `GET /v1/auth/me`;

    test401(route);

    test("returns correct info", async () => {
        const id = Bun.env.ADMIN!;

        const res = await api(forgeAdmin(), route);

        expect(res.id).toBe(id);

        const guild = res.guilds[testData.GUILD.id];
        expect(guild).toMatchObject({ owner: true, advisor: false, voter: true, staff: true });
        for (const role of ["owner", "staff", "voter"]) expect(guild.roles).toContain(role);

        for (const role of ["observer", "owner", "staff", "voter"]) expect(res.roles).toContain(role);
    });
});

describe("POST /auth/invalidate", () => {
    const route = `POST /v1/auth/invalidate`;

    test401(route);

    test("invalidates token", async () => {
        const token = forge(randomId(), { created: Date.now(), expires: Date.now() + 1000 });

        const req1 = await api(token, "!GET /v1/auth/token");
        expect(req1.ok).toBeTrue();

        const req = await api(token, `!${route}`);
        expect(req.ok).toBeTrue();

        const req2 = await api(token, "!GET /v1/auth/token");
        await expectError(req2, 401, codes.MISSING_AUTH);
    });
});

describe("POST /auth/key", () => {
    const route = `POST /v1/auth/key`;
    const testRoute = `GET /v1/auth/key-info`;

    test401(route);

    const id = randomId();

    async function get(options: any, raw: boolean = false) {
        const req = await api(forge(id), `!${route}`, options);
        if (raw) return req;

        expect(req.status).toBe(200);
        return await req.json();
    }

    test("400", async () => {
        const req1 = await get(null, true);
        await expectError(req1, 400, codes.MISSING_BODY);

        for (const object of [{}, { maxage: 0 }, { scopes: [] }, { maxage: -1, scopes: [] }, { maxage: 0, scopes: "" }]) {
            const req = await get(object, true);
            await expectError(req, 400, codes.INVALID_BODY);
        }
    });

    test("no expiry, all scopes", async () => {
        const key = await get({ maxage: 0, scopes: ["all"] });

        const res = await api(key, testRoute);
        expect(res.expiresIn).toBeNull();
        expect(res.expiresAt).toBeNull();
        expect(res.id).toBe(id);
        expect(res.scopes).toEqual(["all"]);

        const req = await api(key, `!${route}`, { maxage: 0, scopes: [] });
        expect(req.ok).toBeTrue();
    });

    test("no expiry, limited scopes", async () => {
        const key = await get({ maxage: 0, scopes: [] });

        const res = await api(key, testRoute);
        expect(res.expiresIn).toBeNull();
        expect(res.expiresAt).toBeNull();
        expect(res.id).toBe(id);
        expect(res.scopes).toEqual([]);

        const req = await api(key, `!${route}`, { maxage: 0, scopes: [] });
        await expectError(req, 403, codes.MISSING_SCOPE);
    });

    test("expiry", async () => {
        const key = await get({ maxage: 1000, scopes: [] });

        const res = await api(key, testRoute);
        expect(res.expiresIn).toBeLessThanOrEqual(1000);
        expect(res.expiresAt).toBeLessThanOrEqual(Date.now() + 1000);
    });
});
