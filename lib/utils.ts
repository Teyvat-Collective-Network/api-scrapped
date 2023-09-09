export function addToSet<T>(array: T[], object: T) {
    if (!array.includes(object)) array.push(object);
}
