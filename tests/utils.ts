import { expect } from "bun:test";
import api from "./api.ts";
import jwt from "../lib/jwt.ts";

export function forge(id: string = "", data: any = {}) {
    return jwt.sign({ id, created: Date.now(), expires: Date.now() + 10000, forge: true, data: { id, guilds: {}, roles: [], ...data } });
}

export function forgeAdmin(data: any = {}) {
    data ??= {};
    data.observer = true;

    return forge(Bun.env.ADMIN!, data);
}

export function forgeOwner(data: any = {}) {
    data ??= {};
    data.guilds ??= {};

    (data.guilds[Bun.env.TEST_GUILD!] ??= {}).owner ||= true;

    return forge(Bun.env.ADMIN!, data);
}

export function test401(route: string) {
    return async () => {
        const req = await api(null, "!" + route);
        expect(req.status).toBe(401);
    };
}

export function testScope(route: string) {
    return async () => {
        const req = await api(forgeAdmin({ scopes: [] }), "!" + route);
        expect(req.status).toBe(403);
    };
}
