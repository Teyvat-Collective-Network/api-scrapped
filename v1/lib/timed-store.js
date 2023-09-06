export default class TimedStore {
    constructor(ttl) {
        this.ttl = ttl;
        this.cache = new Map();
    }

    get(key, callback) {
        const item = this.cache.get(key);

        if (!item || item.expires < Date.now()) {
            if (item) this.cache.delete(key);
            callback(null, null);
            return;
        }

        callback(null, item.value);
    }

    set(key, value, callback) {
        this.cache.set(key, { value, expires: Date.now() + this.ttl });

        for (const [k, v] of this.cache) {
            if (v.expires < Date.now()) this.cache.delete(k);
        }

        callback();
    }

    destroy(key, callback) {
        this.cache.delete(key);
        callback();
    }
}
