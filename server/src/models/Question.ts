import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  options: string[];
  correctAnswer: string;
  type: 'practice' | 'official';
  _id: mongoose.Types.ObjectId;
}

const questionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: [(val: string[]) => val.length > 0, 'At least one option is required']
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: [
      function(this: IQuestion, val: string) {
        return this.options.includes(val);
      },
      'Correct answer must be one of the options'
    ]
  },
  type: {
    type: String,
    enum: ['practice', 'official'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ type: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
