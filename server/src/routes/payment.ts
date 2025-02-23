import express from 'express';
import { auth } from '../middleware/authMiddleware';
import {
  createCheckoutSession,
  verifySession,
  getSubscriptionStatus,
  cancelSubscription,
  handleWebhook
} from '../controllers/paymentController';

const router = express.Router();

// Create checkout session
router.post('/create-checkout-session', auth, createCheckoutSession);

// Verify session
router.get('/verify-session/:sessionId', auth, verifySession);

// Get subscription status
router.get('/subscription-status', auth, getSubscriptionStatus);

// Cancel subscription
router.post('/cancel-subscription', auth, cancelSubscription);

// Webhook handler - raw body parsing is handled at the app level
router.post('/webhook', handleWebhook);

export default router;
