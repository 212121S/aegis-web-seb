import mongoose, { Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  country: string;
  type: 'public' | 'private';
  domain: string;
}

const universitySchema = new mongoose.Schema<IUniversity>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    required: true
  },
  domain: {
    type: String,
    required: true
  }
});

export const University = mongoose.model<IUniversity>('University', universitySchema);
