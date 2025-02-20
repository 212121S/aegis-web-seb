import express from 'express';
import { body } from 'express-validator';
import {
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription,
  verifySession
} from '../controllers/paymentController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Middleware to parse raw body for Stripe webhooks
const rawBodyMiddleware = express.raw({ type: 'application/json' });

// Create checkout session
router.post(
  '/create-checkout-session',
  authenticateToken,
  [
    body('planId')
      .isString()
      .isIn(['basic', 'pro', 'premium'])
      .withMessage('Invalid plan selected'),
  ],
  validateRequest,
  createCheckoutSession
);

// Verify payment session
router.post(
  '/verify-session',
  authenticateToken,
  [
    body('sessionId')
      .isString()
      .notEmpty()
      .withMessage('Session ID is required'),
  ],
  validateRequest,
  verifySession
);

// Handle Stripe webhooks
router.post('/webhook', rawBodyMiddleware, handleWebhook);

// Get subscription status
router.get('/subscription-status', authenticateToken, getSubscriptionStatus);

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, cancelSubscription);

export default router;
