import express from 'express';
import { auth as authMiddleware } from '../middleware/authMiddleware';
import {
  getTestConfiguration,
  generatePracticeTest,
  submitPracticeTest
} from '../controllers/practiceTestController';

const router = express.Router();

// Get available test configuration options (verticals, roles, topics)
router.get('/configuration', authMiddleware, getTestConfiguration);

// Generate a new practice test based on user preferences
router.post('/generate', authMiddleware, generatePracticeTest);

// Submit practice test answers and get results
router.post('/submit', authMiddleware, submitPracticeTest);

// Log routes on startup
console.log('Practice Test Routes:', {
  configuration: '/api/practice/configuration',
  generate: '/api/practice/generate',
  submit: '/api/practice/submit'
});

export default router;
