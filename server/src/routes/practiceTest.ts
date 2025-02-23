import express from 'express';
import { auth as authMiddleware } from '../middleware/authMiddleware';
import {
  getTestConfiguration,
  generatePracticeTest,
  submitPracticeTest
} from '../controllers/practiceTestController';

const router = express.Router();

// Get available test configuration options
router.get('/configuration', authMiddleware, getTestConfiguration);

// Generate a new practice test
router.post('/generate', authMiddleware, generatePracticeTest);

// Submit practice test answers
router.post('/submit', authMiddleware, submitPracticeTest);

export default router;
