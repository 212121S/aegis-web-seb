import { Request, Response } from "express";
import mongoose from "mongoose";
import { Question, TestSession, TestResult, IProctoringEvent } from "../models/Question";
import Stripe from 'stripe';

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
    const { type, browserInfo } = req.body;
    
    if (type === 'practice') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Practice Test',
            },
            unit_amount: PRACTICE_TEST_PRICE,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/test/start?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/dashboard`,
      });
      
      return res.json({ paymentUrl: session.url });
    }

    const testSession = new TestSession({
      userId: req.user!._id,
      startTime: new Date(),
      questions: [],
      currentScore: 0,
      incorrectAnswers: 0,
      status: 'in-progress',
      type,
      proctoring: {
        browserInfo,
        events: [],
        startTime: new Date(),
        status: 'active'
      }
    });

    await testSession.save();
    
    return res.json({ sessionId: testSession._id });
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

    const question = await Question.findOne({
      difficulty: { $gte: currentDifficulty },
      isActive: true,
      _id: { $nin: session.questions.map(q => q.questionId) }
    });

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
    session.proctoring.status = 'completed';
    session.proctoring.endTime = new Date();
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
      proctoringEvents: session.proctoring.events.filter(e => 
        e.type === 'multiple_faces' || e.type === 'looking_away'
      )
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
