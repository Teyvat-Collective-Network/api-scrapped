import mongoose from "mongoose";

export default new mongoose.Schema({
    id: String,
    description: String,
    assignment: String,
});
