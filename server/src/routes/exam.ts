import { Router } from "express";
import * as examController from "../controllers/examController";
import { requireAuth } from "../middleware/authMiddleware";
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

// Test session management
router.post("/initialize", requireAuth, examController.initializeTest);
router.get("/:sessionId/next", requireAuth, examController.getNextQuestion);
router.post("/:sessionId/answer", requireAuth, examController.submitAnswer);
router.post("/:sessionId/recording", requireAuth, upload.single('recording'), examController.submitRecording);
router.post("/:sessionId/finalize", requireAuth, examController.finalizeTest);

export default router;
