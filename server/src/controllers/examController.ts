import { Request, Response } from "express";
import mongoose from "mongoose";
import { Question, TestSession, TestResult, IProctoringEvent, VerificationLink, IQuestion } from "../models/Question";
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

const PRACTICE_TEST_PRICE = 2000; // $20.00 in cents

// Calculate adaptive difficulty based on performance
function calculateNextDifficulty(currentDifficulty: number, isCorrect: boolean): number {
  const difficultyChange = isCorrect ? 1 : -0.5;
  return Math.min(Math.max(currentDifficulty + difficultyChange, 1), 10);
}

// Calculate final score based on difficulty and correctness
function calculateScore(questions: any[]): number {
  const totalPoints = questions.reduce((sum, q) => {
    const difficultyMultiplier = Math.pow(1.2, q.difficulty - 1);
    return sum + (q.userAnswer ? difficultyMultiplier : 0);
  }, 0);
  
  const maxPossiblePoints = questions.reduce((sum, q) => {
    return sum + Math.pow(1.2, q.difficulty - 1);
  }, 0);

  return (totalPoints / maxPossiblePoints) * 100;
}

export async function initializeTest(req: Request, res: Response) {
  try {
    console.log('Initialize Test - Request:', { body: req.body, user: req.user });
    const { type } = req.body;
    
    const testSession = new TestSession({
      userId: req.user!._id,
      startTime: new Date(),
      questions: [],
      currentScore: 0,
      incorrectAnswers: 0,
      status: 'in-progress',
      type,
      proctoring: {
        browserInfo: { name: 'N/A', version: 'N/A', os: 'N/A' },
        events: [],
        startTime: new Date(),
        status: 'completed'
      }
    });

    await testSession.save();
    
    console.log('Initialize Test - Created Session:', testSession);
    const sessionId = testSession._id as mongoose.Types.ObjectId;
    return res.json({ sessionId: sessionId.toString() });
  } catch (err) {
    console.error('Failed to initialize test:', err);
    return res.status(500).json({ error: 'Failed to initialize test' });
  }
}

export async function getNextQuestion(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await TestSession.findById(sessionId);

    if (!session || session.status !== 'in-progress') {
      return res.status(400).json({ error: 'Invalid session' });
    }

    if (session.incorrectAnswers >= 5) {
      session.status = 'completed';
      await session.save();
      return res.json({ completed: true });
    }

    const currentDifficulty = session.questions.length > 0 
      ? session.questions[session.questions.length - 1].difficulty 
      : 1;

    console.log('Getting next question:', {
      currentDifficulty,
      questionsAnswered: session.questions.length,
      answeredIds: session.questions.map(q => q.questionId)
    });

    // First try to find a question with matching difficulty
    let question = await Question.findOne({
      difficulty: currentDifficulty,
      isActive: true,
      _id: { $nin: session.questions.map(q => q.questionId) }
    });

    // If no question found, try with higher difficulty
    if (!question) {
      question = await Question.findOne({
        difficulty: { $gt: currentDifficulty },
        isActive: true,
        _id: { $nin: session.questions.map(q => q.questionId) }
      }).sort({ difficulty: 1 });
    }

    // If still no question, try with lower difficulty
    if (!question) {
      question = await Question.findOne({
        difficulty: { $lt: currentDifficulty },
        isActive: true,
        _id: { $nin: session.questions.map(q => q.questionId) }
      }).sort({ difficulty: -1 });
    }

    console.log('Found question:', question ? { 
      id: question._id,
      difficulty: question.difficulty,
      category: question.category 
    } : 'No question found');

    if (!question) {
      return res.status(404).json({ error: 'No more questions available' });
    }

    return res.json(question);
  } catch (err) {
    console.error('Failed to get next question:', err);
    return res.status(500).json({ error: 'Failed to get next question' });
  }
}

export async function submitAnswer(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { questionId, answer, timeSpent } = req.body;

    const session = await TestSession.findById(sessionId);
    const question = await Question.findById(questionId);

    if (!session || !question) {
      return res.status(400).json({ error: 'Invalid session or question' });
    }

    const isCorrect = answer === question.correctAnswer;
    const nextDifficulty = calculateNextDifficulty(question.difficulty, isCorrect);

    if (!isCorrect) {
      session.incorrectAnswers += 1;
    }

    session.questions.push({
      questionId: question._id as unknown as mongoose.Types.ObjectId,
      userAnswer: answer,
      timeSpent,
      difficulty: question.difficulty
    });

    session.currentScore = calculateScore(session.questions);

    await session.save();

    // Update question statistics
    question.timesSeen += 1;
    question.successRate = (question.successRate * (question.timesSeen - 1) + (isCorrect ? 1 : 0)) / question.timesSeen;
    question.lastUsed = new Date();
    await question.save();

    return res.json({
      isCorrect,
      nextDifficulty,
      currentScore: session.currentScore,
      incorrectAnswers: session.incorrectAnswers
    });
  } catch (err) {
    console.error('Failed to submit answer:', err);
    return res.status(500).json({ error: 'Failed to submit answer' });
  }
}

export async function submitProctoringEvent(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const event: IProctoringEvent = req.body;

    const session = await TestSession.findById(sessionId);
    if (!session) {
      return res.status(400).json({ error: 'Invalid session' });
    }

    session.proctoring.events.push({
      ...event,
      timestamp: new Date()
    });

    await session.save();
    return res.json({ message: 'Event recorded' });
  } catch (err) {
    console.error('Failed to submit proctoring event:', err);
    return res.status(500).json({ error: 'Failed to submit proctoring event' });
  }
}

// Generate a secure verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a verification code
function generateVerificationCode(): string {
  return crypto.randomBytes(4)
    .toString('hex')
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join('-');
}

export async function generateVerificationLink(req: Request, res: Response) {
  try {
    const { testResultId } = req.params;
    const testResult = await TestResult.findById(testResultId);

    if (!testResult) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Generate verification token and code
    const token = generateVerificationToken();
    const code = generateVerificationCode();

    // Create verification link
    const verificationLink = new VerificationLink({
      testResultId: testResult._id,
      token,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      isActive: true
    });

    await verificationLink.save();

    return res.json({
      verificationCode: code,
      verificationUrl: `${process.env.CLIENT_URL}/verify/${token}`
    });
  } catch (err) {
    console.error('Failed to generate verification link:', err);
    return res.status(500).json({ error: 'Failed to generate verification link' });
  }
}

export async function verifyResult(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const verificationLink = await VerificationLink.findOne({ token }).populate('testResultId');

    if (!verificationLink) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    if (!verificationLink.isActive) {
      return res.status(403).json({ error: 'This verification link has been revoked' });
    }

    if (verificationLink.expiresAt < new Date()) {
      return res.status(403).json({ error: 'This verification link has expired' });
    }

    // Update view count
    verificationLink.views += 1;
    await verificationLink.save();

    return res.json(verificationLink.testResultId);
  } catch (err) {
    console.error('Failed to verify result:', err);
    return res.status(500).json({ error: 'Failed to verify result' });
  }
}

export async function verifyCode(req: Request, res: Response) {
  try {
    const { code } = req.body;
    const verificationLink = await VerificationLink.findOne({ code }).populate('testResultId');

    if (!verificationLink) {
      return res.status(404).json({ error: 'Invalid verification code' });
    }

    if (!verificationLink.isActive) {
      return res.status(403).json({ error: 'This verification code has been revoked' });
    }

    if (verificationLink.expiresAt < new Date()) {
      return res.status(403).json({ error: 'This verification code has expired' });
    }

    // Update view count
    verificationLink.views += 1;
    await verificationLink.save();

    return res.json(verificationLink.testResultId);
  } catch (err) {
    console.error('Failed to verify code:', err);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
}

export async function revokeAccess(req: Request, res: Response) {
  try {
    const { testResultId } = req.params;
    
    // Find and deactivate all verification links for this test result
    await VerificationLink.updateMany(
      { testResultId },
      { isActive: false }
    );

    return res.json({ message: 'Access revoked successfully' });
  } catch (err) {
    console.error('Failed to revoke access:', err);
    return res.status(500).json({ error: 'Failed to revoke access' });
  }
}

// Question Management Functions

export async function addQuestion(req: Request, res: Response) {
  try {
    const questionData: IQuestion = req.body;
    const question = new Question(questionData);
    await question.save();
    return res.status(201).json(question);
  } catch (err) {
    console.error('Failed to add question:', err);
    return res.status(500).json({ error: 'Failed to add question' });
  }
}

export async function uploadQuestions(req: Request, res: Response) {
  try {
    const questions: IQuestion[] = req.body;
    const savedQuestions = await Question.insertMany(questions);
    return res.status(201).json(savedQuestions);
  } catch (err) {
    console.error('Failed to upload questions:', err);
    return res.status(500).json({ error: 'Failed to upload questions' });
  }
}

export async function getQuestions(req: Request, res: Response) {
  try {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    const query: any = { isActive: true };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const skip = (Number(page) - 1) * Number(limit);
    
    const questions = await Question.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ lastUsed: -1 });

    const total = await Question.countDocuments(query);

    return res.json({
      questions,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    console.error('Failed to get questions:', err);
    return res.status(500).json({ error: 'Failed to get questions' });
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const question = await Question.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json(question);
  } catch (err) {
    console.error('Failed to update question:', err);
    return res.status(500).json({ error: 'Failed to update question' });
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json({ message: 'Question deactivated successfully' });
  } catch (err) {
    console.error('Failed to delete question:', err);
    return res.status(500).json({ error: 'Failed to delete question' });
  }
}

export async function getTestHistory(req: Request, res: Response) {
  try {
    const userId = req.user!._id;
    const testHistory = await TestResult.find({ userId })
      .sort({ completedAt: -1 })
      .limit(20);
    
    return res.json(testHistory);
  } catch (err) {
    console.error('Failed to get test history:', err);
    return res.status(500).json({ error: 'Failed to get test history' });
  }
}

export async function getTestAnalytics(req: Request, res: Response) {
  try {
    const userId = req.user!._id;
    
    // Get all completed tests for the user
    const tests = await TestResult.find({ 
      userId,
      status: 'completed'
    });

    if (tests.length === 0) {
      return res.json({
        averageScore: 0,
        testsCompleted: 0,
        highestScore: 0,
        averageDifficulty: 0,
        categoryPerformance: {}
      });
    }

    // Calculate analytics
    const analytics = {
      averageScore: tests.reduce((sum, test) => sum + test.finalScore, 0) / tests.length,
      testsCompleted: tests.length,
      highestScore: Math.max(...tests.map(test => test.finalScore)),
      averageDifficulty: tests.reduce((sum, test) => sum + test.averageDifficulty, 0) / tests.length,
      categoryPerformance: {}
    };

    // Calculate category performance
    const categoryStats: { [key: string]: { correct: number, total: number } } = {};
    tests.forEach(test => {
      test.questionBreakdown.forEach(breakdown => {
        if (!categoryStats[breakdown.category]) {
          categoryStats[breakdown.category] = { correct: 0, total: 0 };
        }
        categoryStats[breakdown.category].correct += breakdown.correct;
        categoryStats[breakdown.category].total += breakdown.total;
      });
    });

    analytics.categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      accuracy: (stats.correct / stats.total) * 100,
      total: stats.total
    }));

    return res.json(analytics);
  } catch (err) {
    console.error('Failed to get analytics:', err);
    return res.status(500).json({ error: 'Failed to get analytics' });
  }
}

export async function getTestResults(req: Request, res: Response) {
  try {
    const { testId } = req.params;
    const userId = req.user!._id;

    const testResult = await TestResult.findOne({
      _id: testId,
      userId
    });

    if (!testResult) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    return res.json(testResult);
  } catch (err) {
    console.error('Failed to get test results:', err);
    return res.status(500).json({ error: 'Failed to get test results' });
  }
}

export async function finalizeTest(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await TestSession.findById(sessionId).populate('questions.questionId');
    
    if (!session) {
      return res.status(400).json({ error: 'Invalid session' });
    }

    // Update session status
    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // Calculate category breakdown
    const categoryBreakdown = session.questions.reduce((acc: any, q: any) => {
      const question = q.questionId;
      if (!acc[question.category]) {
        acc[question.category] = { correct: 0, total: 0 };
      }
      acc[question.category].total++;
      if (q.userAnswer === question.correctAnswer) {
        acc[question.category].correct++;
      }
      return acc;
    }, {});

    const avgDifficulty = session.questions.reduce((sum, q) => sum + q.difficulty, 0) / session.questions.length;
    const avgTime = session.questions.reduce((sum, q) => sum + q.timeSpent, 0) / session.questions.length;

    // Create test result
    const testResult = new TestResult({
      sessionId: session._id,
      userId: session.userId,
      finalScore: session.currentScore,
      questionBreakdown: Object.entries(categoryBreakdown).map(([category, stats]: [string, any]) => ({
        category,
        correct: stats.correct,
        total: stats.total
      })),
      averageDifficulty: avgDifficulty,
      timePerQuestion: avgTime,
      type: session.type,
      completedAt: new Date(),
      proctoringEvents: []
    });

    await testResult.save();

    // Calculate percentile
    const lowerScores = await TestResult.countDocuments({
      finalScore: { $lt: testResult.finalScore },
      type: session.type
    });
    const totalTests = await TestResult.countDocuments({ type: session.type });
    testResult.percentile = (lowerScores / totalTests) * 100;
    await testResult.save();

    return res.json(testResult);
  } catch (err) {
    console.error('Failed to finalize test:', err);
    return res.status(500).json({ error: 'Failed to finalize test' });
  }
}
