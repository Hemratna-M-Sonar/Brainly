import mongoose, { Schema,model } from "mongoose";

// Define User Schema
const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

// Define Content Schema
const ContentSchema = new Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

export const UserModel = model("User", UserSchema);
export const ContentModel = model("Content", ContentSchema);


