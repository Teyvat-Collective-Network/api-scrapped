type RRR<T> = Record<string, Record<string, Record<string, T>>>;

export const versions = ["v1", "test"];

export default function <T>(data: Record<string, T>, entries?: RRR<T>): RRR<T> {
    entries ??= {};

    for (const [key, value] of Object.entries(data)) {
        const [vlist, method, route] = key.split(" ");

        for (const version of vlist === "*" ? versions : vlist.split("/")) {
            entries[version] ??= {};
            entries[version][method] ??= {};
            entries[version][method][route] = value;
        }
    }

    return entries;
}
