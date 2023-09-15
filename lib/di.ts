import codes from "./codes.ts";

export default async function (route: string, body?: any) {
    let request = false;

    if (route.startsWith("!")) {
        request = true;
        route = route.slice(1);
    }

    const [method, path] = route.split(" ");

    let req: Response;

    try {
        req = await fetch(`${Bun.env.DISCORD_INTERFACE}${path}`, { method, body: JSON.stringify(body) });
    } catch {
        throw [503, codes.INTERFACE_OFFLINE, "The Discord Interface is unavailable."];
    }

    if (request) return req;

    if (!req.ok) throw req.status;
    return await req.json();
}
