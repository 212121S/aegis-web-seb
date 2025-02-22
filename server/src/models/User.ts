import { Document, Schema, model, Types } from 'mongoose';

export interface ITestHistory {
  testId: Types.ObjectId;
  type: 'practice' | 'official';
  score: number;
  date: Date;
  questions: Array<{
    questionId: string;
    userAnswer: string;
    correct: boolean;
  }>;
}

export interface IUser {
  email: string;
  password: string;
  name: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationToken?: string;
  emailVerificationToken?: string;
  phoneVerificationCode?: string;
  subscription: {
    active: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    planId?: string;
    currentPeriodEnd?: Date;
  };
  testResults?: Array<{
    score: number;
    date: Date;
  }>;
  testHistory: ITestHistory[];
  highestScore: number;
  averageScore: number;
}

export interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  emailVerificationToken: String,
  phoneVerificationCode: String,
  subscription: {
    active: {
      type: Boolean,
      default: false
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    planId: String,
    currentPeriodEnd: Date
  },
  testResults: [{
    score: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  testHistory: [{
    testId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['practice', 'official'],
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    questions: [{
      questionId: {
        type: String,
        required: true
      },
      userAnswer: {
        type: String,
        required: true
      },
      correct: {
        type: Boolean,
        required: true
      }
    }]
  }],
  highestScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
});

export const User = model<IUserDocument>('User', userSchema);
