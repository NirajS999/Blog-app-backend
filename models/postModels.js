import { Schema, model } from "mongoose";


const postSchema = new Schema({
    title: { type: String, required: true },
    category: { type: String, enum: [ "Agriculture", "Business", "Education", "Entertainment", "Art", "Investment", "Uncategorized", "Weather", "Technology" ], message: 'Value is not supported' },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User"},
},{timestamps: true})

export const Post = model("post",postSchema);