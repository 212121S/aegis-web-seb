// server/src/models/question.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IQuestion extends Document {
  prompt: string;
  choices: string[];
  correctAnswer: string;
  difficulty: number; // 1-10 scale
  category: string; // e.g., "Financial Modeling", "Accounting", "Valuation"
  subcategory?: string; // More specific topic
  timesSeen: number; // Track question exposure
  successRate: number; // Track question difficulty empirically
  lastUsed?: Date; // For rotation purposes
  isActive: boolean; // For question bank management
}

export interface IProctoringEvent {
  type: 'multiple_faces' | 'looking_away' | 'background_noise' | 'face_detected';
  timestamp: Date;
  details?: string;
}

export interface IProctoringSession {
  browserInfo: {
    name: string;
    version: string;
    os: string;
  };
  events: IProctoringEvent[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'terminated';
}

export interface ITestSession extends Document {
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  questions: {
    questionId: mongoose.Types.ObjectId;
    userAnswer?: string;
    timeSpent: number; // in seconds
    difficulty: number;
  }[];
  currentScore: number;
  incorrectAnswers: number;
  status: 'in-progress' | 'completed' | 'terminated';
  type: 'official' | 'practice';
  paymentId?: string; // For practice tests
  proctoring: IProctoringSession;
}

export interface ITestResult extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  finalScore: number;
  percentile?: number;
  questionBreakdown: {
    category: string;
    correct: number;
    total: number;
  }[];
  maxDifficulty: number; // Highest difficulty level reached
  questionsAttempted: number; // Total questions attempted
  incorrectAnswers: number; // Total incorrect answers
  totalTimeMinutes: number; // Total time taken in minutes
  averageDifficulty: number;
  timePerQuestion: number;
  type: 'official' | 'practice';
  completedAt: Date;
  proctoringEvents?: IProctoringEvent[]; // Summary of significant events
}

export interface IVerificationLink extends Document {
  testResultId: mongoose.Types.ObjectId;
  token: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  views: number;
}

const ProctoringEventSchema = new Schema<IProctoringEvent>({
  type: { type: String, required: true, enum: ['multiple_faces', 'looking_away', 'background_noise', 'face_detected'] },
  timestamp: { type: Date, required: true },
  details: String
});

const ProctoringSessionSchema = new Schema<IProctoringSession>({
  browserInfo: {
    name: { type: String, required: true },
    version: { type: String, required: true },
    os: { type: String, required: true }
  },
  events: [ProctoringEventSchema],
  startTime: { type: Date, required: true },
  endTime: Date,
  status: { type: String, required: true, enum: ['active', 'completed', 'terminated'] }
});

const QuestionSchema = new Schema<IQuestion>({
  prompt: { type: String, required: true },
  choices: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  difficulty: { type: Number, required: true, min: 1, max: 10 },
  category: { type: String, required: true },
  subcategory: String,
  timesSeen: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  lastUsed: Date,
  isActive: { type: Boolean, default: true }
});

const TestSessionSchema = new Schema<ITestSession>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  startTime: { type: Date, required: true },
  endTime: Date,
  questions: [{
    questionId: { type: Schema.Types.ObjectId, required: true, ref: 'Question' },
    userAnswer: String,
    timeSpent: { type: Number, required: true },
    difficulty: { type: Number, required: true }
  }],
  currentScore: { type: Number, required: true, default: 0 },
  incorrectAnswers: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, enum: ['in-progress', 'completed', 'terminated'] },
  type: { type: String, required: true, enum: ['official', 'practice'] },
  paymentId: String,
  proctoring: { type: ProctoringSessionSchema, required: true }
});

const TestResultSchema = new Schema<ITestResult>({
  sessionId: { type: Schema.Types.ObjectId, required: true, ref: 'TestSession' },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  finalScore: { type: Number, required: true },
  percentile: Number,
  questionBreakdown: [{
    category: { type: String, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  maxDifficulty: { type: Number, required: true },
  questionsAttempted: { type: Number, required: true },
  incorrectAnswers: { type: Number, required: true },
  totalTimeMinutes: { type: Number, required: true },
  averageDifficulty: { type: Number, required: true },
  timePerQuestion: { type: Number, required: true },
  type: { type: String, required: true, enum: ['official', 'practice'] },
  completedAt: { type: Date, required: true },
  proctoringEvents: [ProctoringEventSchema]
});

const VerificationLinkSchema = new Schema<IVerificationLink>({
  testResultId: { type: Schema.Types.ObjectId, required: true, ref: 'TestResult' },
  token: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, required: true, default: true },
  views: { type: Number, required: true, default: 0 }
});

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export const TestSession = mongoose.model<ITestSession>('TestSession', TestSessionSchema);
export const TestResult = mongoose.model<ITestResult>('TestResult', TestResultSchema);
export const VerificationLink = mongoose.model<IVerificationLink>('VerificationLink', VerificationLinkSchema);
