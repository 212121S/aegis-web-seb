import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  answer: string;
  explanation: string;
  difficulty: number;
  type: 'multiple_choice' | 'open_ended';
  industryVerticals: string[];
  roles: string[];
  topics: string[];
  source: {
    type: 'base' | 'ai';
    timestamp: Date;
    prompt?: string;
    cached?: boolean;
  };
  options?: string[];
  correctOption?: string;
  difficultyRating?: {
    userRated: number;
    systemRated: number;
    totalAttempts: number;
  };
  rubric?: {
    criteria: Array<{
      concept: string;
      description: string;
      weight: number;
    }>;
  };
  _id: mongoose.Types.ObjectId;
}

// Constants for validation
const VALID_VERTICALS = [
  'Healthcare', 'FIG', 'TMT', 'Energy', 'Retail & Consumer',
  'Industrials', 'Real Estate', 'Gaming, Lodging & Leisure',
  'Natural Resources & Metals/Mining', 'Transportation & Infrastructure'
];

const VALID_ROLES = [
  'Investment Banking', 'Equity Research', 'Leveraged Finance',
  'Restructuring', 'Wealth Management', 'DCM', 'ECM',
  'Private Credit', 'M&A'
];

const VALID_TOPICS = [
  'Accounting', 'DCF', 'Comparable Company Analysis',
  'Precedent Transactions', 'M&A / Synergy Modeling',
  'LBO Modeling', 'Restructuring / Distressed Analysis',
  'Capital Markets', 'Credit Analysis', 'Portfolio Theory'
];

const questionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    validate: {
      validator: Number.isInteger,
      message: 'Difficulty must be an integer between 1 and 8'
    }
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'open_ended'],
    required: true
  },
  industryVerticals: {
    type: [String],
    required: true,
    validate: [
      (val: string[]) => val.every(v => VALID_VERTICALS.includes(v)),
      'Invalid industry vertical'
    ]
  },
  roles: {
    type: [String],
    required: true,
    validate: [
      (val: string[]) => val.every(r => VALID_ROLES.includes(r)),
      'Invalid role'
    ]
  },
  topics: {
    type: [String],
    required: true,
    validate: [
      (val: string[]) => val.every(t => VALID_TOPICS.includes(t)),
      'Invalid topic'
    ]
  },
  source: {
    type: {
      type: String,
      enum: ['base', 'ai'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    prompt: String,
    cached: Boolean
  },
  options: {
    type: [String],
    validate: [
      function(this: IQuestion, val: string[] | undefined) {
        return this.type !== 'multiple_choice' || (val && val.length > 0);
      },
      'Multiple choice questions must have options'
    ]
  },
  correctOption: {
    type: String,
    validate: [
      function(this: IQuestion, val: string | undefined) {
        return this.type !== 'multiple_choice' || 
          (val && this.options?.includes(val));
      },
      'Correct option must be one of the provided options'
    ]
  },
  difficultyRating: {
    userRated: {
      type: Number,
      min: 1,
      max: 8
    },
    systemRated: {
      type: Number,
      min: 1,
      max: 8
    },
    totalAttempts: {
      type: Number,
      default: 0
    }
  },
  rubric: {
    criteria: [{
      concept: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      weight: {
        type: Number,
        required: true,
        min: 1,
        max: 100
      }
    }]
  }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ type: 1 });
questionSchema.index({ industryVerticals: 1 });
questionSchema.index({ roles: 1 });
questionSchema.index({ topics: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ 'source.type': 1 });
questionSchema.index({ 'source.timestamp': 1 });

// Export constants for use in other parts of the application
export const QuestionConstants = {
  VALID_VERTICALS,
  VALID_ROLES,
  VALID_TOPICS
};

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
