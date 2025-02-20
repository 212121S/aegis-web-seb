import { Router } from "express";
import * as examController from "../controllers/examController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireActiveSubscription } from "../middleware/subscriptionMiddleware";
import multer from "multer";

const router = Router();

// Configure multer for recording uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Test session management - all routes require active subscription
router.post("/initialize", authenticateToken, requireActiveSubscription, examController.initializeTest);
router.get("/:sessionId/next", authenticateToken, requireActiveSubscription, examController.getNextQuestion);
router.post("/:sessionId/answer", authenticateToken, requireActiveSubscription, examController.submitAnswer);
router.post("/:sessionId/recording", authenticateToken, requireActiveSubscription, upload.single('recording'), examController.submitRecording);
router.post("/:sessionId/finalize", authenticateToken, requireActiveSubscription, examController.finalizeTest);

export default router;
