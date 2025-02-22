import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  phone?: string;
  verificationToken?: string;
  phoneVerificationToken?: string;
  officialTestCredits: number;
  subscription: {
    active: boolean;
    plan?: string;
    startDate?: Date;
    endDate?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  testHistory: Array<{
    score: number;
    date: Date;
  }>;
  testResults?: Array<{
    score: number;
    date: Date;
  }>;
  highestScore: number;
  averageScore: number;
}

const userSchema = new Schema<IUser>({
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
    select: false // Don't include password by default in queries
  },
  name: {
    type: String,
    required: true,
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
  phone: {
    type: String,
    trim: true,
    sparse: true
  },
  verificationToken: String,
  phoneVerificationToken: String,
  subscription: {
    active: {
      type: Boolean,
      default: false
    },
    plan: String,
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  testHistory: [{
    score: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
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
  highestScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  officialTestCredits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'subscription.stripeCustomerId': 1 });

// Methods
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.phoneVerificationToken;
  return obj;
};

// Update highest and average scores when test results are added
userSchema.pre('save', function(next) {
  if (this.isModified('testResults')) {
    const scores = this.testResults?.map(result => result.score) || [];
    if (scores.length > 0) {
      this.highestScore = Math.max(...scores);
      this.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
