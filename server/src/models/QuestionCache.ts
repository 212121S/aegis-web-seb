import mongoose, { Document, Schema } from 'mongoose';
import { QuestionConstants } from './Question';

export interface IQuestionCache extends Document {
  prompt: string;
  questions: mongoose.Types.ObjectId[];
  created: Date;
  expiresAt: Date;
  metadata: {
    verticals: string[];
    roles: string[];
    topics: string[];
    difficulty: number[];
  };
}

const questionCacheSchema = new Schema<IQuestionCache>({
  prompt: {
    type: String,
    required: true
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  created: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index that automatically removes expired documents
  },
  metadata: {
    verticals: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.every(v => QuestionConstants.VALID_VERTICALS.includes(v)),
        'Invalid industry vertical'
      ]
    },
    roles: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.every(r => QuestionConstants.VALID_ROLES.includes(r)),
        'Invalid role'
      ]
    },
    topics: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.every(t => QuestionConstants.VALID_TOPICS.includes(t)),
        'Invalid topic'
      ]
    },
    difficulty: {
      type: [Number],
      required: true,
      validate: [
        (val: number[]) => val.every(d => Number.isInteger(d) && d >= 1 && d <= 8),
        'Difficulty must be integers between 1 and 8'
      ]
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
questionCacheSchema.index({ 'metadata.verticals': 1 });
questionCacheSchema.index({ 'metadata.roles': 1 });
questionCacheSchema.index({ 'metadata.topics': 1 });
questionCacheSchema.index({ created: 1 });
questionCacheSchema.index({ expiresAt: 1 });

export const QuestionCache = mongoose.model<IQuestionCache>('QuestionCache', questionCacheSchema);
