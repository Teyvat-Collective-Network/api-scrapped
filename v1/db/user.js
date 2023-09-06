import mongoose from "mongoose";

export default new mongoose.Schema({
    id: String,
    guilds: { type: Map, of: [String] },
    roles: [String],
});
