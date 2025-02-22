import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Question, IQuestion } from "../models/Question";

interface UserDocument {
  _id: Types.ObjectId;
  subscription: {
    active: boolean;
  };
}

interface AnswerSubmission {
  questionId: string;
  answer: string;
}

export const getPracticeQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get practice questions from database
    const questions = await Question.aggregate<IQuestion>([
      { $match: { type: 'practice' } },
      { $sample: { size: 10 } },
      {
        $project: {
          text: 1,
          options: 1,
          type: 1,
          _id: 1
        }
      }
    ]);

    if (!questions.length) {
      res.status(404).json({ error: 'No practice questions available' });
      return;
    }

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
    const questions = await Question.aggregate<IQuestion>([
      { $match: { type: 'official' } },
      { $sample: { size: 10 } },
      {
        $project: {
          text: 1,
          options: 1,
          type: 1,
          _id: 1
        }
      }
    ]);

    if (!questions.length) {
      res.status(404).json({ error: 'No official questions available' });
      return;
    }

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

    const { answers } = req.body as { answers: AnswerSubmission[] };
    if (!Array.isArray(answers)) {
      res.status(400).json({ error: 'Invalid answers format' });
      return;
    }

    // Get correct answers and calculate score
    const questionIds = answers.map(a => new Types.ObjectId(a.questionId));
    const questions = await Question.find({ _id: { $in: questionIds } });

    const score = answers.reduce((total, answer) => {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        return total + 1;
      }
      return total;
    }, 0);

    // Save test result
    await User.findByIdAndUpdate(user._id, {
      $push: {
        testResults: {
          score: (score / answers.length) * 100,
          date: new Date()
        }
      }
    });

    res.json({
      score: (score / answers.length) * 100,
      totalQuestions: answers.length,
      correctAnswers: score
    });
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

    const { answers } = req.body as { answers: AnswerSubmission[] };
    if (!Array.isArray(answers)) {
      res.status(400).json({ error: 'Invalid answers format' });
      return;
    }

    // Get correct answers and calculate score
    const questionIds = answers.map(a => new Types.ObjectId(a.questionId));
    const questions = await Question.find({ _id: { $in: questionIds } });

    const score = answers.reduce((total, answer) => {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        return total + 1;
      }
      return total;
    }, 0);

    // Save test result
    await User.findByIdAndUpdate(user._id, {
      $push: {
        testResults: {
          score: (score / answers.length) * 100,
          date: new Date(),
          type: 'official'
        }
      }
    });

    res.json({
      score: (score / answers.length) * 100,
      totalQuestions: answers.length,
      correctAnswers: score
    });
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

    const userWithHistory = await User.findById(user._id).select('testResults');
    if (!userWithHistory) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(userWithHistory.testResults || []);
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

    const userWithResults = await User.findById(user._id).select('testResults');
    if (!userWithResults) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const testResults = userWithResults.testResults || [];
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
