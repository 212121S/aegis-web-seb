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

// Log all routes for debugging
console.log('Exam Routes:', {
  practice: '/api/exam/practice',
  practiceSubmit: '/api/exam/practice/submit',
  official: '/api/exam/official',
  officialSubmit: '/api/exam/official/submit',
  history: '/api/exam/history',
  results: '/api/exam/results'
});

export default router;
