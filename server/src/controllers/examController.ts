import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Collection, ObjectId } from "mongodb";
import { client } from "../database";
import { getQuestionCollection, IQuestion, ITestSession, ITestResult } from "../models/Question";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

const PRACTICE_TEST_PRICE = 2000; // $20.00 in cents

function getTestSessionCollection(): Collection<ITestSession> {
  return client.db("aegis").collection<ITestSession>("testSessions");
}

function getTestResultCollection(): Collection<ITestResult> {
  return client.db("aegis").collection<ITestResult>("testResults");
}

// Calculate adaptive difficulty based on performance
function calculateNextDifficulty(currentDifficulty: number, isCorrect: boolean): number {
  const difficultyChange = isCorrect ? 1 : -0.5;
  return Math.min(Math.max(currentDifficulty + difficultyChange, 1), 10);
}

// Calculate final score based on difficulty and correctness
function calculateScore(questions: ITestSession['questions']): number {
  const totalPoints = questions.reduce((sum, q) => {
    const difficultyMultiplier = Math.pow(1.2, q.difficulty - 1);
    return sum + (q.userAnswer ? difficultyMultiplier : 0);
  }, 0);
  
  const maxPossiblePoints = questions.reduce((sum, q) => {
    return sum + Math.pow(1.2, q.difficulty - 1);
  }, 0);

  return (totalPoints / maxPossiblePoints) * 100;
}

export async function initializeTest(req: AuthRequest, res: Response) {
  try {
    const { type } = req.body;
    
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

    const testSession: ITestSession = {
      userId: req.user!._id,
      startTime: new Date(),
      questions: [],
      currentScore: 0,
      incorrectAnswers: 0,
      status: 'in-progress',
      type,
    };

    const sessionCol = getTestSessionCollection();
    const result = await sessionCol.insertOne(testSession);
    
    return res.json({ sessionId: result.insertedId });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function getNextQuestion(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const sessionCol = getTestSessionCollection();
    const session = await sessionCol.findOne({ _id: new ObjectId(sessionId) });

    if (!session || session.status !== 'in-progress') {
      return res.status(400).json({ error: 'Invalid session' });
    }

    if (session.incorrectAnswers >= 5) {
      session.status = 'completed';
      await sessionCol.updateOne({ _id: new ObjectId(sessionId) }, { $set: { status: 'completed' } });
      return res.json({ completed: true });
    }

    const currentDifficulty = session.questions.length > 0 
      ? session.questions[session.questions.length - 1].difficulty 
      : 1;

    const questionCol = getQuestionCollection();
    const pipeline = [
      { 
        $match: { 
          difficulty: { $gte: currentDifficulty },
          isActive: true,
          _id: { $nin: session.questions.map(q => q.questionId) }
        } 
      },
      { $sample: { size: 1 } }
    ];

    const questions = await questionCol.aggregate(pipeline).toArray();
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No more questions available' });
    }

    return res.json(questions[0]);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function submitAnswer(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const { questionId, answer, timeSpent } = req.body;

    const sessionCol = getTestSessionCollection();
    const questionCol = getQuestionCollection();

    const session = await sessionCol.findOne({ _id: new ObjectId(sessionId) });
    const question = await questionCol.findOne({ _id: new ObjectId(questionId) });

    if (!session || !question) {
      return res.status(400).json({ error: 'Invalid session or question' });
    }

    const isCorrect = answer === question.correctAnswer;
    const nextDifficulty = calculateNextDifficulty(question.difficulty, isCorrect);

    if (!isCorrect) {
      session.incorrectAnswers += 1;
    }

    session.questions.push({
      questionId: new ObjectId(questionId),
      userAnswer: answer,
      timeSpent,
      difficulty: question.difficulty
    });

    session.currentScore = calculateScore(session.questions);

    await sessionCol.updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: {
          questions: session.questions,
          currentScore: session.currentScore,
          incorrectAnswers: session.incorrectAnswers
        }
      }
    );

    // Update question statistics
    await questionCol.updateOne(
      { _id: new ObjectId(questionId) },
      {
        $inc: { timesSeen: 1 },
        $set: {
          successRate: (question.successRate * question.timesSeen + (isCorrect ? 1 : 0)) / (question.timesSeen + 1),
          lastUsed: new Date()
        }
      }
    );

    return res.json({
      isCorrect,
      nextDifficulty,
      currentScore: session.currentScore,
      incorrectAnswers: session.incorrectAnswers
    });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function submitRecording(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const { recordingUrl } = req.body;

    const sessionCol = getTestSessionCollection();
    await sessionCol.updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { recordingUrl } }
    );

    return res.json({ message: 'Recording submitted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function finalizeTest(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    
    const sessionCol = getTestSessionCollection();
    const resultCol = getTestResultCollection();
    
    const session = await sessionCol.findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      return res.status(400).json({ error: 'Invalid session' });
    }

    // Calculate category breakdown
    const questionCol = getQuestionCollection();
    const questions = await questionCol.find({
      _id: { $in: session.questions.map(q => new ObjectId(q.questionId)) }
    }).toArray();

    const categoryBreakdown = questions.reduce((acc: any, q) => {
      if (!acc[q.category]) {
        acc[q.category] = { correct: 0, total: 0 };
      }
      const userAnswer = session.questions.find(sq => sq.questionId === q._id);
      acc[q.category].total++;
      if (userAnswer?.userAnswer === q.correctAnswer) {
        acc[q.category].correct++;
      }
      return acc;
    }, {});

    const avgDifficulty = session.questions.reduce((sum, q) => sum + q.difficulty, 0) / session.questions.length;
    const avgTime = session.questions.reduce((sum, q) => sum + q.timeSpent, 0) / session.questions.length;

    const testResult: ITestResult = {
      sessionId: new ObjectId(sessionId),
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
      completedAt: new Date()
    };

    await resultCol.insertOne(testResult);
    await sessionCol.updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'completed',
          endTime: new Date()
        }
      }
    );

    // Calculate percentile (compare against other completed tests)
    const lowerScores = await resultCol.countDocuments({
      finalScore: { $lt: testResult.finalScore },
      type: session.type
    });
    const totalTests = await resultCol.countDocuments({ type: session.type });
    testResult.percentile = (lowerScores / totalTests) * 100;

    await resultCol.updateOne(
      { _id: testResult._id! },
      { $set: { percentile: testResult.percentile } }
    );

    return res.json(testResult);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
