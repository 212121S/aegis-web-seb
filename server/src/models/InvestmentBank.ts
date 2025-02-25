import mongoose, { Document, Schema } from 'mongoose';

interface IBankGroup {
  _id?: mongoose.Types.ObjectId;
  name: string;
  fullName: string;
  type: string;
  difficulty: number;
  topics: string[];
  description: string;
}

export interface IInvestmentBank extends Document {
  name: string;
  logoUrl?: string;
  description?: string;
  tier: 'bulge_bracket' | 'elite_boutique' | 'middle_market' | 'other';
  active: boolean; // To easily enable/disable banks without deleting them
  groups: IBankGroup[];
  version: number;
  lastUpdated: Date;
  _id: mongoose.Types.ObjectId;
}

const bankGroupSchema = new Schema<IBankGroup>({
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  topics: {
    type: [String],
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const investmentBankSchema = new Schema<IInvestmentBank>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  logoUrl: {
    type: String
  },
  description: {
    type: String
  },
  tier: {
    type: String,
    enum: ['bulge_bracket', 'elite_boutique', 'middle_market', 'other'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  groups: [bankGroupSchema],
  version: {
    type: Number,
    default: 1
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
investmentBankSchema.index({ name: 1 });
investmentBankSchema.index({ tier: 1 });
investmentBankSchema.index({ active: 1 });
investmentBankSchema.index({ 'groups.type': 1 });

export const InvestmentBank = mongoose.model<IInvestmentBank>('InvestmentBank', investmentBankSchema);
