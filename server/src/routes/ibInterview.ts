import express from 'express';
import { auth as authMiddleware } from '../middleware/authMiddleware';
import {
  getBanksAndGroups,
  getBankById,
  generateIBInterviewQuestions
} from '../controllers/ibInterviewController';

const router = express.Router();

// Get all banks and their groups
router.get('/banks', authMiddleware, getBanksAndGroups);

// Get a specific bank by ID
router.get('/banks/:id', authMiddleware, getBankById);

// Generate IB interview questions
router.post('/generate', authMiddleware, generateIBInterviewQuestions);

// Log routes on startup
console.log('IB Interview Routes:', {
  getBanksAndGroups: '/api/ib-interview/banks',
  getBankById: '/api/ib-interview/banks/:id',
  generateIBInterviewQuestions: '/api/ib-interview/generate'
});

export default router;
