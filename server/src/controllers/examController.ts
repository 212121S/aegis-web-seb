import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Question from "../models/Question";

export async function getQuestions(req: AuthRequest, res: Response) {
  try {
    // example: fetch random set of difficulty 1
    const questions = await Question.aggregate([
      { $match: { difficulty: 1 } },
      { $sample: { size: 5 } }
    ]);
    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function submitExam(req: AuthRequest, res: Response) {
  try {
    // user sends { score, totalQuestions }
    const { score, totalQuestions } = req.body;
    // In real usage, you'd store in DB (TestResult model).
    // For now, just respond:
    return res.json({ message: "Exam submitted", score, totalQuestions });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}