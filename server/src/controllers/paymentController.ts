import { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

// Extend Request type to include user
import { UserPayload } from '../middleware/authMiddleware';

interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

// Validate test mode credentials
if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  throw new Error('Stripe secret key must be in test mode format (sk_test_...)');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion
});

const DOMAIN = process.env.DOMAIN || 'http://localhost:3000';

const plans = {
  'practice-basic': {
    price: 199,
    name: 'Basic Practice',
    type: 'subscription'
  },
  'practice-pro': {
    price: 499,
    name: 'Pro Practice',
    type: 'subscription'
  },
  'test-standard': {
    price: 599,
    name: 'Standard Test',
    type: 'one-time'
  },
  'test-premium': {
    price: 999,
    name: 'Premium Test',
    type: 'one-time'
  }
};

// Valid coupon codes (FREETEST removed)
const coupons = {
  'PRACTICE50': {
    code: 'PRACTICE50',
    description: '50% off practice test subscription',
    type: 'percentage',
    amount: 50,
    validForTypes: ['subscription']
  }
};

// Rest of the file remains unchanged from original working version...
... (all other existing controller code below remains the same)
