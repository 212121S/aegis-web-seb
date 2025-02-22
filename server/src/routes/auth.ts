import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken,
  getUserVerification,
  regenerateVerificationToken,
  addTestResult
} from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/verify', authenticateToken, verifyToken);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Test result routes
router.post('/test-result', authenticateToken, addTestResult);

// Verification routes
router.get('/verification/:token', getUserVerification);
router.post('/verification/regenerate', authenticateToken, regenerateVerificationToken);

export default router;
