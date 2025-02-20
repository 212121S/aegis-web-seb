// server/src/models/question.ts
import { Collection, ObjectId } from "mongodb";
import { client } from "../database";

export interface IQuestion {
  _id?: ObjectId;
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

export interface ITestSession {
  _id?: ObjectId;
  userId: ObjectId;
  startTime: Date;
  endTime?: Date;
  questions: {
    questionId: ObjectId;
    userAnswer?: string;
    timeSpent: number; // in seconds
    difficulty: number;
  }[];
  currentScore: number;
  incorrectAnswers: number;
  recordingUrl?: string;
  status: 'in-progress' | 'completed' | 'terminated';
  type: 'official' | 'practice';
  paymentId?: string; // For practice tests
}

export interface ITestResult {
  _id?: ObjectId;
  sessionId: ObjectId;
  userId: ObjectId;
  finalScore: number;
  percentile?: number;
  questionBreakdown: {
    category: string;
    correct: number;
    total: number;
  }[];
  averageDifficulty: number;
  timePerQuestion: number;
  type: 'official' | 'practice';
  completedAt: Date;
}

/**
 * Returns the "questions" collection from the "aegis" DB.
 */
export function getQuestionCollection(): Collection<IQuestion> {
  const dbName = "aegis";
  return client.db(dbName).collection<IQuestion>("questions");
}
