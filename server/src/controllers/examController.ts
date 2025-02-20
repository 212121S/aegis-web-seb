import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { getQuestionCollection } from "../models/Question";

export async function getQuestions(req: AuthRequest, res: Response) {
  try {
    const questionCol = getQuestionCollection();

    // example: fetch random set of difficulty = 1
    // Using the native driver:
    // "aggregate([{ $match: { difficulty: 1 } }, { $sample: { size: 5 } }])"
    const pipeline = [
      { $match: { difficulty: 1 } },
      { $sample: { size: 5 } }
    ];

    const cursor = questionCol.aggregate(pipeline);
    const questions = await cursor.toArray();

    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function submitExam(req: AuthRequest, res: Response) {
  try {
    const { score, totalQuestions } = req.body;
    // e.g., store in a "results" collection or do whatever
    // For now, just respond:
    return res.json({ message: "Exam submitted", score, totalQuestions });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}