import { Schema, model } from "mongoose";

export const userSchema = new Schema({
    name: { type:String, required:true },
    email: { type:String, required:true },
    password: { type:String, required:true },
    avatar: { type:String },
    posts:{ type:Number, default:0 }
})

export const User = model("User",userSchema);