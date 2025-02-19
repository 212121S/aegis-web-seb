import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  prompt: string;
  choices: string[];
  correctAnswer: string;
  difficulty: number;
}

const questionSchema = new Schema<IQuestion>({
  prompt: { type: String, required: true },
  choices: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  difficulty: { type: Number, default: 1 }
});

export default mongoose.model<IQuestion>("Question", questionSchema);