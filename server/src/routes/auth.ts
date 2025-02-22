import express from 'express';
import { auth } from '../middleware/authMiddleware';
import {
  login,
  register,
  getProfile,
  updateProfile,
  verifyToken,
  getUserVerification,
  regenerateVerificationToken,
  addTestResult
} from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/verify-token', verifyToken);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/verification', auth, getUserVerification);
router.post('/regenerate-token', auth, regenerateVerificationToken);
router.post('/test-result', auth, addTestResult);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
