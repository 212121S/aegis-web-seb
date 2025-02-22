import express from 'express';
import { auth } from '../middleware/authMiddleware';
import { 
  getQuestions,
  submitAnswer,
  getTestHistory
} from '../controllers/examController';

const router = express.Router();

// Protected routes
router.get('/questions', auth, getQuestions);
router.post('/submit', auth, submitAnswer);
router.get('/history', auth, getTestHistory);

export default router;
