import { hash } from "bcrypt";
import mongoose, { Schema, model } from "mongoose";

const Userschema = new Schema({
  username: { type: String, unique: true },
  password: { type: String },
});

export const UserModel = mongoose.model("User", Userschema);

const Contentschema = new Schema({
  title: String,
  link: String,
  ContentType: String,
  tags: { type: mongoose.Types.ObjectId, ref: "Tag" },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

const Linkschema = new Schema({
  hash: String,
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

export const LinkModel = mongoose.model("Links", Linkschema);

export const ContentModel = mongoose.model("content", Contentschema);
