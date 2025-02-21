import { Router } from 'express';
import { 
  initializeTest, 
  getNextQuestion, 
  submitAnswer, 
  submitProctoringEvent, 
  finalizeTest,
  generateVerificationLink,
  verifyResult,
  verifyCode,
  revokeAccess,
  addQuestion,
  uploadQuestions,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getTestHistory,
  getTestAnalytics,
  getTestResults
} from '../controllers/examController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateSubscription } from '../middleware/subscriptionMiddleware';

const router = Router();

// Test session routes
router.post('/initialize', authenticateToken, validateSubscription, initializeTest);
router.get('/:sessionId/next-question', authenticateToken, getNextQuestion);
router.post('/:sessionId/submit', authenticateToken, submitAnswer);
router.post('/:sessionId/proctoring', authenticateToken, submitProctoringEvent);
router.post('/:sessionId/finalize', authenticateToken, finalizeTest);

// Test history and analytics routes - no subscription required
router.get('/history', authenticateToken, getTestHistory);
router.get('/analytics', authenticateToken, getTestAnalytics);
router.get('/results/:testId', authenticateToken, getTestResults);

// Verification routes
router.post('/verify/:testResultId/generate', authenticateToken, generateVerificationLink);
router.get('/verify/:token', verifyResult);
router.post('/verify/code', verifyCode);
router.post('/verify/:testResultId/revoke', authenticateToken, revokeAccess);

// Question management routes
router.post('/questions', authenticateToken, validateSubscription, addQuestion);
router.post('/questions/bulk', authenticateToken, validateSubscription, uploadQuestions);
router.get('/questions', authenticateToken, validateSubscription, getQuestions);
router.put('/questions/:id', authenticateToken, validateSubscription, updateQuestion);
router.delete('/questions/:id', authenticateToken, validateSubscription, deleteQuestion);

export default router;
