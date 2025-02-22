import express from 'express';
import { auth } from '../middleware/authMiddleware';
import {
  createCheckoutSession,
  handleWebhook,
  cancelSubscription,
  verifySession,
  validateCoupon,
  getSubscriptionStatus
} from '../controllers/paymentController';

const router = express.Router();

// Public routes
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/verify-session/:sessionId', verifySession);
router.get('/validate-coupon/:code', validateCoupon);

// Protected routes
router.post('/create-checkout-session', auth, createCheckoutSession);
router.post('/cancel', auth, cancelSubscription);
router.get('/subscription-status', auth, getSubscriptionStatus);

export default router;
