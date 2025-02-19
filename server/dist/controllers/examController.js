"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitExam = exports.getQuestions = void 0;
const Question_1 = __importDefault(require("../models/Question"));
async function getQuestions(req, res) {
    try {
        // example: fetch random set of difficulty 1
        const questions = await Question_1.default.aggregate([
            { $match: { difficulty: 1 } },
            { $sample: { size: 5 } }
        ]);
        return res.json(questions);
    }
    catch (err) {
        return res.status(500).json({ error: err });
    }
}
exports.getQuestions = getQuestions;
async function submitExam(req, res) {
    try {
        // user sends { score, totalQuestions }
        const { score, totalQuestions } = req.body;
        // In real usage, you'd store in DB (TestResult model).
        // For now, just respond:
        return res.json({ message: "Exam submitted", score, totalQuestions });
    }
    catch (err) {
        return res.status(500).json({ error: err });
    }
}
exports.submitExam = submitExam;
