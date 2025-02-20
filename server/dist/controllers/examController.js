"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitExam = exports.getQuestions = void 0;
const Question_1 = require("../models/Question");
async function getQuestions(req, res) {
    try {
        const questionCol = (0, Question_1.getQuestionCollection)();
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
    }
    catch (err) {
        return res.status(500).json({ error: err });
    }
}
exports.getQuestions = getQuestions;
async function submitExam(req, res) {
    try {
        const { score, totalQuestions } = req.body;
        // e.g., store in a "results" collection or do whatever
        // For now, just respond:
        return res.json({ message: "Exam submitted", score, totalQuestions });
    }
    catch (err) {
        return res.status(500).json({ error: err });
    }
}
exports.submitExam = submitExam;
