import { Request, Response } from "express";
import { Question, IQuestionDocument } from "../models/Question";
import { User, ITestHistory } from "../models/User";
import mongoose from "mongoose";

export async function getQuestions(req: Request, res: Response): Promise<void> {
  try {
    const questions = await Question.find().limit(10);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

export async function submitAnswer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { questionId, answer, isOfficial } = req.body;

    const question = await Question.findById(questionId) as IQuestionDocument;
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const isCorrect = answer === question.correctAnswer;
    const testResult = {
      _id: new mongoose.Types.ObjectId(),
      score: isCorrect ? 1 : 0,
      date: new Date(),
      type: isOfficial ? 'official' as const : 'practice' as const
    };

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const testHistoryEntry: ITestHistory = {
      testId: testResult._id,
      score: testResult.score,
      date: testResult.date,
      type: testResult.type,
      questions: [{
        questionId: (question._id as mongoose.Types.ObjectId).toString(),
        userAnswer: answer,
        correct: isCorrect
      }]
    };

    user.testHistory.push(testHistoryEntry);

    if (testResult.type === 'official') {
      const officialTests = user.testHistory.filter(test => test.type === 'official');
      const scores = officialTests.map(test => test.score);
      user.highestScore = Math.max(...scores, user.highestScore);
      user.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    await user.save();

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
}

export async function getTestHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId).select('testHistory highestScore averageScore');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      testHistory: user.testHistory,
      highestScore: user.highestScore,
      averageScore: user.averageScore
    });
  } catch (error) {
    console.error('Error fetching test history:', error);
    res.status(500).json({ error: 'Failed to fetch test history' });
  }
}
