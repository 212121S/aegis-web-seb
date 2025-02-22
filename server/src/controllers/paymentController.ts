import { Request, Response } from 'express';
import { User } from '../models/User';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
console.warn(STRIPE_SECRET_KEY ? '✓ Stripe configured' : '⚠️  Stripe not configured - payment features will be disabled');

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia'
  });
}

const checkStripeAvailable = (res: Response): boolean => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment service not available' });
    return false;
  }
  return true;
};

export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId).select('subscription');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.subscription?.stripeSubscriptionId) {
      const subscription = await (stripe as Stripe).subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );

      res.json({
        active: subscription.status === 'active',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan: subscription.items.data[0]?.price.id
      });
    } else {
      res.json({
        active: false,
        currentPeriodEnd: null,
        plan: null
      });
    }
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    
    const { priceId } = req.body;
    if (!priceId) {
      res.status(400).json({ error: 'Price ID is required' });
      return;
    }

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isOfficialTest = priceId === process.env.STRIPE_OFFICIAL_TEST_PRICE_ID;
    const session = await (stripe as Stripe).checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: priceId === process.env.STRIPE_OFFICIAL_TEST_PRICE_ID ? 'payment' : 'subscription',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: userId.toString(),
        priceId: priceId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    const sig = req.headers['stripe-signature'];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Missing signature or webhook secret' });
      return;
    }

    const event = (stripe as Stripe).webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        
        if (!userId) break;

        if (session.mode === 'subscription') {
          await User.findByIdAndUpdate(userId, {
            'subscription.active': true,
            'subscription.stripeCustomerId': session.customer,
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.planId': priceId === process.env.STRIPE_BASIC_SUBSCRIPTION_PRICE_ID ? 'basic' : 'premium'
          });
        } else if (session.mode === 'payment') {
          // Handle one-time payment for official test
          await User.findByIdAndUpdate(userId, {
            $inc: { 'officialTestCredits': 1 }
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': subscription.id },
          { 'subscription.active': false }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user?.subscription?.stripeSubscriptionId) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }

    await (stripe as Stripe).subscriptions.cancel(user.subscription.stripeSubscriptionId);
    await User.findByIdAndUpdate(userId, { 'subscription.active': false });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    const { sessionId } = req.params;
    const session = await (stripe as Stripe).checkout.sessions.retrieve(sessionId);
    res.json({ 
      paymentStatus: session.payment_status,
      status: session.status,
      customerId: session.customer,
      subscriptionId: session.subscription
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    const { code } = req.params;
    const coupon = await (stripe as Stripe).coupons.retrieve(code);
    res.json({ valid: true, discount: coupon.percent_off });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.json({ valid: false });
  }
};
