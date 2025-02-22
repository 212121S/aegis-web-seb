import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";

interface UserDocument {
  _id: Types.ObjectId;
  testHistory: Array<{
    score: number;
    date: Date;
  }>;
  testResults: Array<{
    score: number;
    date: Date;
  }>;
  subscription: {
    active: boolean;
  };
}

export const getPracticeQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get practice questions from database
    const questions = []; // TODO: Implement question retrieval
    res.json(questions);
  } catch (error) {
    console.error('Get practice questions error:', error);
    res.status(500).json({ error: 'Failed to get practice questions' });
  }
};

export const getOfficialQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!user.subscription.active) {
      res.status(403).json({ error: 'Active subscription required' });
      return;
    }

    // Get official questions from database
    const questions = []; // TODO: Implement question retrieval
    res.json(questions);
  } catch (error) {
    console.error('Get official questions error:', error);
    res.status(500).json({ error: 'Failed to get official questions' });
  }
};

export const submitPracticeTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { answers, score } = req.body;

    // Save test result
    const testResult = {
      score,
      date: new Date()
    };

    await User.findByIdAndUpdate(user._id, {
      $push: { testResults: testResult }
    });

    res.json({ message: 'Practice test submitted successfully' });
  } catch (error) {
    console.error('Submit practice test error:', error);
    res.status(500).json({ error: 'Failed to submit practice test' });
  }
};

export const submitOfficialTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!user.subscription.active) {
      res.status(403).json({ error: 'Active subscription required' });
      return;
    }

    const { answers, score } = req.body;

    // Save test result
    const testResult = {
      score,
      date: new Date()
    };

    await User.findByIdAndUpdate(user._id, {
      $push: { testResults: testResult }
    });

    res.json({ message: 'Official test submitted successfully' });
  } catch (error) {
    console.error('Submit official test error:', error);
    res.status(500).json({ error: 'Failed to submit official test' });
  }
};

export const getTestHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const testResults = user.testResults || [];
    res.json(testResults);
  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({ error: 'Failed to get test history' });
  }
};

export const getTestResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const testResults = user.testResults || [];
    const stats = {
      totalTests: testResults.length,
      averageScore: testResults.length > 0
        ? testResults.reduce((sum, test) => sum + test.score, 0) / testResults.length
        : 0,
      highestScore: testResults.length > 0
        ? Math.max(...testResults.map(test => test.score))
        : 0,
      recentTests: testResults.slice(-5).reverse()
    };

    res.json(stats);
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: 'Failed to get test results' });
  }
};
