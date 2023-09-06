import mongoose from "mongoose";
import guild from "./guild.js";
import user from "./user.js";
import invalidation from "./invalidation.js";
import role from "./role.js";

export default class Database {
    constructor(uri) {
        this.guilds = mongoose.model("guilds", guild);
        this.invalidations = mongoose.model("invalidations", invalidation);
        this.roles = mongoose.model("roles", role);
        this.users = mongoose.model("users", user);

        mongoose.set("strictQuery", false);
        mongoose.connect(uri);
    }
}
