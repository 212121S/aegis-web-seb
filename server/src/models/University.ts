import mongoose, { Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  country: string;
  type: 'public' | 'private';
  domain: string;
  updatedAt: Date;
}

const universitySchema = new mongoose.Schema<IUniversity>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true // Add index for faster lookups
  },
  country: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true // Add index for TTL queries
  }
});

// Create a TTL index on updatedAt
universitySchema.index({ updatedAt: 1 }, { 
  expireAfterSeconds: parseInt(process.env.UNIVERSITY_CACHE_TTL || '86400', 10)
});

export const University = mongoose.model<IUniversity>('University', universitySchema);
