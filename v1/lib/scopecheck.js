export default async function (request, scope) {
    if (!scope) return true;

    const user = await request.auth();
    if (!user) return false;
    if (!user.scopes || user.scopes.includes("allF")) return true;

    while (true) {
        if (user.scopes.includes(scope)) return true;
        if (!scope.includes("/")) return false;
        scope = scope.replace(/\/[^\/]*$/, "");
    }
}
