export default function (scope, scopes) {
    if (!scopes) return true;
    if (scopes.includes("all")) return true;

    while (true) {
        if (scopes.includes(scope)) return true;
        if (!scope.includes("/")) return false;
        scope = scope.replace(/\/[^\/]*$/, "");
    }
}
