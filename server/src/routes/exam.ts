import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { 
  initializeTest, 
  getNextQuestion, 
  submitAnswer, 
  submitProctoringEvent,
  finalizeTest 
} from '../controllers/examController';

const router = Router();

// Initialize a new test session
router.post('/initialize', authenticateToken, initializeTest);

// Get the next question
router.get('/:sessionId/next', authenticateToken, getNextQuestion);

// Submit an answer
router.post('/:sessionId/answer', authenticateToken, submitAnswer);

// Submit a proctoring event
router.post('/:sessionId/proctoring-event', authenticateToken, submitProctoringEvent);

// Finalize test
router.post('/:sessionId/finalize', authenticateToken, finalizeTest);

export default router;
