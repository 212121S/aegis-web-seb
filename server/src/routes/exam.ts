import express from 'express';
import { auth } from '../middleware/authMiddleware';
import {
  getPracticeQuestions,
  getOfficialQuestions,
  submitPracticeTest,
  submitOfficialTest,
  getTestHistory,
  getTestResults
} from '../controllers/examController';

const router = express.Router();

// Practice test routes
router.get('/practice', auth, getPracticeQuestions);
router.post('/practice/submit', auth, submitPracticeTest);

// Official test routes
router.get('/official', auth, getOfficialQuestions);
router.post('/official/submit', auth, submitOfficialTest);

// Test history and results
router.get('/history', auth, getTestHistory);
router.get('/results', auth, getTestResults);

export default router;
