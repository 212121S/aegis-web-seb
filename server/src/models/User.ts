import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  phone: string;
  role: string; // optional
}

const userSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: "student" }
});

export default mongoose.model<IUser>("User", userSchema);