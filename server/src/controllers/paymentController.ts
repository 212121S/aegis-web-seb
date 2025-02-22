import { Request, Response } from 'express';
import { User } from '../models/User';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
});

export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
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
      const subscription = await stripe.subscriptions.retrieve(
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

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: userId.toString()
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
    const sig = req.headers['stripe-signature'];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Missing signature or webhook secret' });
      return;
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            'subscription.active': true,
            'subscription.stripeCustomerId': session.customer,
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.planId': 'premium'
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

    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
    await User.findByIdAndUpdate(userId, { 'subscription.active': false });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ status: session.payment_status });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const coupon = await stripe.coupons.retrieve(code);
    res.json({ valid: true, discount: coupon.percent_off });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.json({ valid: false });
  }
};
