import mongoose from "mongoose";

export default new mongoose.Schema({
    id: String,
    guilds: Object,
    roles: [String],
});
