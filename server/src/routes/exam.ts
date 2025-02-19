import { Router } from "express";
import * as examController from "../controllers/examController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Example protected routes
router.get("/questions", requireAuth, examController.getQuestions);
router.post("/submit", requireAuth, examController.submitExam);

export default router;