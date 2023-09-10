import { expect } from "bun:test";
import api from "./api.ts";
import jwt from "../lib/jwt.ts";
import codes from "../lib/codes.ts";
import testData from "./testData.ts";

export function forge(id: string = "", data: any = {}) {
    return jwt.sign({ id, created: Date.now(), expires: Date.now() + 10000, forge: true, data: { id, guilds: {}, roles: [], ...data } });
}

const users = new Set<string>([Bun.env.ADMIN!, testData.ADMIN_2, testData.GUILD.id, testData.GUILD_2.id]);

export function randomId() {
    while (true) {
        const user = new Array(20)
            .fill(0)
            .map(() => Math.floor(Math.random() * 10))
            .join("");

        if (users.has(user)) continue;
        users.add(user);
        return user;
    }
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

export function test401(route: string) {
    return async () => {
        const req = await api(null, "!" + route);
        await expectError(req, 401, codes.MISSING_AUTH);
    };
}

export function testScope(route: string) {
    return async () => {
        const req = await api(forgeAdmin({ scopes: [] }), "!" + route);
        await expectError(req, 403, codes.MISSING_SCOPE);
    };
}

export async function expectError(req: Response, status: number, code: number) {
    expect(req.status).toBe(status);

    const res = await req.json();
    expect(res.code).toBe(code);
}
