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
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/verify-token', verifyToken);
router.get('/verification', auth, getUserVerification);
router.post('/regenerate-token', auth, regenerateVerificationToken);
router.post('/test-result', auth, addTestResult);

export default router;
