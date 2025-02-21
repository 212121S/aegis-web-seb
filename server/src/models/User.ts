import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ISubscription {
  planId: string;
  active: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  phone: string;
  subscription?: ISubscription;
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
    enum: ['basic', 'pro', 'premium'],
  },
  active: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  currentPeriodEnd: Date
});

const userSchema = new mongoose.Schema<IUser>({
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
  subscription: subscriptionSchema
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
