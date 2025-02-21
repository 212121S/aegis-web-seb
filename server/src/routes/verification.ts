import express from 'express';
import {
  generateVerificationLink,
  verifyResult,
  verifyCode,
  revokeAccess
} from '../controllers/examController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Generate verification link and code for a test result
// Only accessible by the test taker
router.post(
  '/generate/:testResultId',
  authenticateToken,
  generateVerificationLink
);

// Verify a result using a verification token (public route)
router.get(
  '/token/:token',
  verifyResult
);

// Verify a result using a verification code (public route)
router.post(
  '/code',
  verifyCode
);

// Revoke access to verification links and codes
// Only accessible by the test taker
router.post(
  '/revoke/:testResultId',
  authenticateToken,
  revokeAccess
);

export default router;
