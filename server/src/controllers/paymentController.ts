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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
});

export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).select('subscription email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeSubscription: Stripe.Response<Stripe.Subscription> | undefined;
    
    if (user.subscription?.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );

        if (stripeSubscription) {
          if (stripeSubscription.status === 'active' && !user.subscription.active) {
            await User.findByIdAndUpdate(userId, {
              'subscription.active': true,
              'subscription.currentPeriodEnd': new Date(stripeSubscription.current_period_end * 1000)
            });
            user.subscription.active = true;
            user.subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          } else if (stripeSubscription.status !== 'active' && user.subscription.active) {
            await User.findByIdAndUpdate(userId, {
              'subscription.active': false
            });
            user.subscription.active = false;
          }
        }
      } catch (error: any) {
        if (error?.type === 'StripeInvalidRequestError' && error?.statusCode === 404) {
          await User.findByIdAndUpdate(userId, {
            'subscription.active': false,
            'subscription.stripeSubscriptionId': null
          });
          user.subscription.active = false;
          user.subscription.stripeSubscriptionId = undefined;
        }
      }
    }

    res.json({
      active: user.subscription?.active || false,
      plan: user.subscription?.planId,
      endDate: user.subscription?.currentPeriodEnd,
      details: {
        stripeCustomerId: user.subscription?.stripeCustomerId,
        stripeSubscriptionId: user.subscription?.stripeSubscriptionId,
        stripeStatus: stripeSubscription?.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
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
    res.status(400).json({ error: 'Webhook error' });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user?.subscription?.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
    await User.findByIdAndUpdate(userId, { 'subscription.active': false });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const verifySession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ status: session.payment_status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify session' });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const coupon = await stripe.coupons.retrieve(code);
    res.json({ valid: true, discount: coupon.percent_off });
  } catch (error) {
    res.json({ valid: false });
  }
};
