import { expect, test } from "bun:test";
import api from "./api.ts";
import jwt from "../lib/jwt.ts";
import codes from "../lib/codes.ts";
import testData from "./testData.ts";

export function forge(id: string = "", data: any = {}) {
    return jwt.sign({ id, created: Date.now(), expires: Date.now() + 10000, forge: true, data: { id, guilds: {}, roles: [], ...data } });
}

export function randomSnowflake() {
    return new Array(20)
        .fill(0)
        .map((_, i) => Math.floor(Math.random() * (i ? 10 : 9) + (i ? 0 : 1)))
        .join("");
}

export function randomId() {
    return new Array(32)
        .fill(0)
        .map(() => "abcdefghijklmnopqrstuvwxyz-"[Math.floor(Math.random() * 27)])
        .join("");
}

export function forgeAdmin(data: any = {}) {
    data ??= {};
    data.observer = true;

    return forge(Bun.env.ADMIN!, data);
}

export function forgeOwner(data: any = {}) {
    data ??= {};
    data.guilds ??= {};

    (data.guilds[testData.GUILD.id] ??= {}).owner ||= true;

    return forge(Bun.env.ADMIN!, data);
}

export async function expectError(req: Response, status: number, code: number) {
    expect(req.status).toBe(status);

    const res = await req.json();
    expect(res.code).toBe(code);
}

const codeMap = {
    401: codes.MISSING_AUTH,
    403: codes.FORBIDDEN,
    409: codes.DUPLICATE,
} as const;

export function testE(error: keyof typeof codeMap | [number, number], route: string, data?: any, pre?: () => any) {
    const code = typeof error === "number" ? error : error[0];

    test(`${error}`, async () => {
        if (pre) await pre();
        const req = await api(code === 401 ? null : code === 403 ? forge() : forgeAdmin(), route.startsWith("!") ? route : `!${route}`, data);
        if (typeof error === "number") await expectError(req, error, codeMap[error]);
        else await expectError(req, ...error);
    });
}

export function testScope(route: string) {
    test("scope", async () => {
        const req = await api(forgeAdmin({ scopes: [] }), route.startsWith("!") ? route : `!${route}`);
        await expectError(req, 403, codes.MISSING_SCOPE);
    });
}
