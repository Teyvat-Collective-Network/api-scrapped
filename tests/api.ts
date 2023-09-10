import { expect } from "bun:test";

export default async function (token: string | null, route: string, body?: any, init?: RequestInit) {
    let request = route.startsWith("!");
    if (request) route = route.slice(1);

    const [method, real] = route.split(" ");

    init ??= {};
    init.method = method;

    if (body) init.body = JSON.stringify(body);

    if (token) {
        init.headers ??= {};

        if (Array.isArray(init.headers)) init.headers.push(["authorization", token]);
        else if (init.headers instanceof Headers) init.headers.append("authorization", token);
        else (init.headers as any).authorization = token;
    }

    const req = await fetch(`http://localhost:${Bun.env.PORT}${real}`, init);
    if (request) return req;

    if (!req.ok) {
        console.error(`[TEST] API call failed (${req.status})`);
        console.error(JSON.stringify(await req.json(), undefined, 4));

        expect().fail("API call that was expected to be OK failed");
    }

    const text = await req.text();

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}
