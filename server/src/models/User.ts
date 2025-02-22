import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface ISubscription {
  planId: string;
  active: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
}

export interface ITestHistory {
  testId: mongoose.Types.ObjectId;
  score: number;
  date: Date;
  type: 'official' | 'practice';
}

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  phone: string;
  university: mongoose.Types.ObjectId;
  dateOfBirth: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerificationToken: string;
  phoneVerificationCode: string;
  tosAccepted: boolean;
  tosAcceptedDate: Date;
  subscription?: ISubscription;
  testHistory: ITestHistory[];
  highestScore: number;
  averageScore: number;
  verificationToken: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const subscriptionSchema = new mongoose.Schema<ISubscription>({
  planId: {
    type: String,
    enum: ['practice-basic', 'practice-pro', 'test-standard', 'test-premium'],
  },
  active: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  currentPeriodEnd: Date
});

const testHistorySchema = new mongoose.Schema<ITestHistory>({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestResult', required: true },
  score: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { type: String, required: true, enum: ['official', 'practice'] }
});

const userSchema = new mongoose.Schema<IUser>({
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: [true, 'University is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(v: Date) {
        // Must be at least 13 years old
        const minAge = 13;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - minAge);
        return v <= cutoff;
      },
      message: 'Must be at least 13 years old'
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  phoneVerificationCode: {
    type: String,
    sparse: true
  },
  tosAccepted: {
    type: Boolean,
    required: [true, 'Terms of Service must be accepted']
  },
  tosAcceptedDate: {
    type: Date,
    required: [true, 'Terms of Service acceptance date is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\+?[\d\s-]{10,}$/.test(v.replace(/\s+/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  subscription: subscriptionSchema,
  testHistory: [testHistorySchema],
  highestScore: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  verificationToken: { 
    type: String, 
    unique: true,
    sparse: true,
    default: () => crypto.randomBytes(32).toString('hex')
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc: IUser, ret: Record<string, any>) {
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(this: IUser, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Static method to find user by email
userSchema.statics.findByEmail = async function(email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Add indexes
userSchema.index({ 'subscription.stripeCustomerId': 1 });
userSchema.index({ 'subscription.active': 1 });

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
