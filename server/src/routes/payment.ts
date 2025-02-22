import express from 'express';
import { auth } from '../middleware/authMiddleware';
import { User, IUser } from '../models/User';
import Stripe from 'stripe';
import { Types } from 'mongoose';

interface UserDocument extends IUser {
  _id: Types.ObjectId;
}

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion
    })
  : null;

console.log(stripe ? '✓ Stripe configured' : '⚠️  Stripe not configured - payment features will be disabled');

// Create checkout session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const user = req.user as UserDocument;
    if (!user?._id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Subscription',
              description: 'Access to all premium features',
            },
            unit_amount: 4999, // $49.99
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment`,
      customer_email: user.email,
      metadata: {
        userId: user._id.toString()
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify session
router.get('/verify-session/:sessionId', auth, async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const user = req.user as UserDocument;
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.userId !== user._id.toString()) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (session.payment_status === 'paid') {
      user.subscription = {
        active: true,
        plan: 'premium',
        startDate: new Date(),
        stripeCustomerId: session.customer?.toString(),
        stripeSubscriptionId: session.subscription?.toString()
      };

      await user.save();
      res.json({ success: true });
    } else {
      res.json({ success: false, status: session.payment_status });
    }
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// Get subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      active: user.subscription?.active || false,
      plan: user.subscription?.plan,
      startDate: user.subscription?.startDate
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const user = req.user as UserDocument;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.subscription?.stripeSubscriptionId) {
      res.status(400).json({ error: 'No active subscription found' });
      return;
    }

    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);

    user.subscription.active = false;
    await user.save();

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const sig = req.headers['stripe-signature'];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.subscription.active = subscription.status === 'active';
            await user.save();
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

export default router;
