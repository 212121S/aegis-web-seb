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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion
});

const DOMAIN = process.env.DOMAIN || 'http://localhost:3000';

const plans = {
  'practice-basic': {
    price: 2999, // $29.99
    name: 'Basic Practice',
    type: 'subscription'
  },
  'practice-pro': {
    price: 4999, // $49.99
    name: 'Pro Practice',
    type: 'subscription'
  },
  'test-standard': {
    price: 9999, // $99.99
    name: 'Standard Test',
    type: 'one-time'
  },
  'test-premium': {
    price: 14999, // $149.99
    name: 'Premium Test',
    type: 'one-time'
  }
};

// Valid coupon codes and their effects
const coupons = {
  'FREETEST': {
    code: 'FREETEST',
    description: '100% off your first test',
    type: 'percentage',
    amount: 100,
    validForTypes: ['one-time']
  },
  'PRACTICE50': {
    code: 'PRACTICE50',
    description: '50% off practice test subscription',
    type: 'percentage',
    amount: 50,
    validForTypes: ['subscription']
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = coupons[code.toUpperCase() as keyof typeof coupons];

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    res.json({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      amount: coupon.amount,
      validForTypes: coupon.validForTypes
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ message: 'Failed to validate coupon' });
  }
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!planId || !plans[planId as keyof typeof plans]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const plan = plans[planId as keyof typeof plans];

    // Apply coupon if provided
    const { couponCode } = req.body;
    let finalPrice = plan.price;
    
    if (couponCode) {
      const coupon = coupons[couponCode.toUpperCase() as keyof typeof coupons];
      if (coupon && coupon.validForTypes.includes(plan.type)) {
        finalPrice = Math.max(0, plan.price - (plan.price * coupon.amount / 100));
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `Access to ${plan.name} features`,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: plan.type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/pricing`,
      customer_email: req.user?.email,
      metadata: {
        userId: userId,
        planId: planId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing stripe signature or webhook secret');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Webhook Error:', errorMessage);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
};

export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user from database to check subscription
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If no subscription data exists
    if (!user.subscription) {
      return res.json({ active: false });
    }

    // Check if subscription is active and not expired
    const isActive = user.subscription.active && 
                    user.subscription.currentPeriodEnd && 
                    new Date(user.subscription.currentPeriodEnd) > new Date();

    res.json({
      active: isActive,
      plan: user.subscription.planId,
      currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString(),
      stripeCustomerId: user.subscription.stripeCustomerId,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
};

export const verifySession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.userId !== userId) {
      return res.status(403).json({ message: 'Invalid session' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Update user's subscription status if not already updated by webhook
    const user = await User.findById(userId);
    if (user && (!user.subscription?.active || user.subscription?.planId !== session.metadata?.planId)) {
      user.subscription = {
        planId: session.metadata?.planId || 'basic',
        active: true,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        currentPeriodEnd: new Date((session.expires_at || 0) * 1000)
      };
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ message: 'Failed to verify session' });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userId,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const subscription = subscriptions.data[0];
    await stripe.subscriptions.cancel(subscription.id);

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
};

// Helper functions
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    throw new Error('Missing user ID or plan ID in session metadata');
  }

  try {
    await User.findByIdAndUpdate(userId, {
      subscription: {
        planId,
        active: true,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        currentPeriodEnd: new Date((session.expires_at || 0) * 1000)
      }
    });
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    throw new Error('Missing user ID in subscription metadata');
  }

  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        'subscription.active': false,
        'subscription.currentPeriodEnd': new Date()
      }
    });
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
}
