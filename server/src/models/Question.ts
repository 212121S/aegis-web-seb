import { Document, Schema, model } from 'mongoose';

export interface IQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface IQuestionDocument extends Document, IQuestion {}

const questionSchema = new Schema<IQuestionDocument>({
  text: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  }
});

export const Question = model<IQuestionDocument>('Question', questionSchema);
