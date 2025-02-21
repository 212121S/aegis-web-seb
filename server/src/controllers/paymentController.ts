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

// Valid coupon codes
const coupons = {
  'PRACTICE50': {
    code: 'PRACTICE50',
    description: '50% off practice test subscription',
    type: 'percentage',
    amount: 50,
    validForTypes: ['subscription']
  }
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId, couponCode } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const plan = plans[planId as keyof typeof plans];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    let finalAmount = plan.price;
    if (couponCode) {
      const coupon = coupons[couponCode as keyof typeof coupons];
      if (coupon && coupon.validForTypes.includes(plan.type)) {
        finalAmount = Math.floor(plan.price * (1 - coupon.amount / 100));
      } else {
        return res.status(400).json({ error: 'Invalid or incompatible coupon code' });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: req.user?.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: plan.type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/payment-cancelled`,
      metadata: {
        userId: userId.toString(),
        planId: planId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId) {
          const plan = plans[planId as keyof typeof plans];
          if (plan) {
            const subscriptionData: Record<string, any> = {
              'subscription.planId': planId,
              'subscription.active': true,
              'subscription.currentPeriodEnd': plan.type === 'subscription' 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                : null
            };

            if (plan.type === 'subscription') {
              const customer = await stripe.customers.create({
                email: session.customer_email || undefined,
                metadata: { userId }
              });
              
              subscriptionData['subscription.stripeCustomerId'] = customer.id;
              if (session.subscription) {
                subscriptionData['subscription.stripeSubscriptionId'] = session.subscription.toString();
              }
            }

            await User.findByIdAndUpdate(userId, subscriptionData as any);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            'subscription.active': false,
            'subscription.planId': null,
            'subscription.currentPeriodEnd': null,
            'subscription.stripeSubscriptionId': null
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const coupon = coupons[code as keyof typeof coupons];

    if (!coupon) {
      return res.status(400).json({ 
        valid: false,
        error: 'Invalid coupon code' 
      });
    }

    res.json({
      valid: true,
      discount: coupon.amount,
      type: coupon.type,
      description: coupon.description,
      validForTypes: coupon.validForTypes
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

export const verifySession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.metadata?.userId !== userId.toString()) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    res.json({
      status: session.status,
      paymentStatus: session.payment_status,
      planId: session.metadata?.planId
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).select('subscription');
    if (!user?.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      'subscription.active': false,
      'subscription.planId': null,
      'subscription.currentPeriodEnd': null,
      'subscription.stripeSubscriptionId': null
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).select('subscription');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      active: user.subscription?.active || false,
      plan: user.subscription?.planId,
      endDate: user.subscription?.currentPeriodEnd
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};
