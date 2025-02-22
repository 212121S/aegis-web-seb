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

const DOMAIN = process.env.DOMAIN || 'http://localhost:3002';

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
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return res.status(500).json({ error: 'Payment service not properly configured' });
    }

    const { planId, couponCode } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate plan
    const plan = plans[planId as keyof typeof plans];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Check if user already has an active subscription for subscription plans
    if (plan.type === 'subscription' && user.subscription?.active) {
      return res.status(400).json({ error: 'User already has an active subscription' });
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

    // Create or retrieve price ID based on plan type
    let priceId;
    try {
      const product = await stripe.products.create({
        name: plan.name,
        metadata: {
          planId: planId
        }
      });

      const priceData = {
        currency: 'usd',
        product: product.id,
        unit_amount: finalAmount,
      };

      if (plan.type === 'subscription') {
        Object.assign(priceData, {
          recurring: {
            interval: 'month'
          }
        });
      }

      const price = await stripe.prices.create(priceData);
      priceId = price.id;
    } catch (err) {
      console.error('Error creating Stripe product/price:', err);
      throw new Error('Failed to configure payment product');
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: plan.type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/payment/cancelled`,
      metadata: {
        userId: userId.toString(),
        planId: planId
      },
      customer_creation: 'always'
    };

    // Add customer email if available
    if (req.user?.email) {
      sessionParams.customer_email = req.user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
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

    // Log all incoming webhook events
    console.log('Webhook event received:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        console.log('Webhook: Processing checkout.session.completed', {
          sessionId: session.id,
          userId,
          planId,
          paymentStatus: session.payment_status,
          customer: session.customer,
          subscription: session.subscription,
          paymentIntent: session.payment_intent,
          created: new Date(session.created * 1000).toISOString()
        });

        if (!userId || !planId) {
          console.error('Webhook: Missing userId or planId in session metadata');
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        const plan = plans[planId as keyof typeof plans];
        if (!plan) {
          console.error('Webhook: Invalid plan ID:', planId);
          return res.status(400).json({ error: 'Invalid plan ID' });
        }

        try {
          // For subscription plans
          if (plan.type === 'subscription' && session.subscription) {
            // First retrieve and verify the subscription
            const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());
            
            // Log subscription details from Stripe
            console.log('Webhook: Retrieved Stripe subscription:', {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              customer: subscription.customer,
              metadata: subscription.metadata
            });

            // Update the subscription metadata with userId
            await stripe.subscriptions.update(subscription.id, {
              metadata: {
                userId: userId.toString()
              }
            });

            // Update the customer metadata
            if (session.customer) {
              await stripe.customers.update(session.customer.toString(), {
                metadata: {
                  userId: userId.toString()
                }
              });
            }

            const subscriptionData = {
              $unset: {
                'subscription.stripeSubscriptionId': '',
                'subscription.stripeCustomerId': ''
              }
            };

            // First remove any existing subscription data
            await User.findByIdAndUpdate(userId, subscriptionData);

            // Then set the new subscription data
            const newSubscriptionData = {
              $set: {
                'subscription.planId': planId,
                'subscription.active': true,
                'subscription.stripeCustomerId': session.customer,
                'subscription.stripeSubscriptionId': subscription.id,
                'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
              }
            };

            // Log update operation
            console.log('Webhook: Updating user subscription data:', {
              userId,
              subscriptionData: newSubscriptionData
            });

            // Verify user exists before update
            const existingUser = await User.findById(userId);
            if (!existingUser) {
              console.error('Webhook: User not found for update:', userId);
              return res.status(404).json({ error: 'User not found' });
            }

            const updatedUser = await User.findByIdAndUpdate(
              userId,
              newSubscriptionData,
              { new: true }
            ).select('subscription');

            if (!updatedUser) {
              console.error('Webhook: Failed to update user:', userId);
              return res.status(500).json({ error: 'Failed to update user subscription' });
            }

            console.log('Webhook: Updated subscription data:', {
              userId,
              subscriptionData: newSubscriptionData,
              updatedUser: updatedUser?.subscription
            });
            
            console.log('Webhook: Updated user subscription:', {
              userId,
              subscription: updatedUser?.subscription
            });
          } else {
            // For one-time payments
            const subscriptionData = {
              $set: {
                'subscription.planId': planId,
                'subscription.active': true,
                'subscription.currentPeriodEnd': null
              }
            };

            const updatedUser = await User.findByIdAndUpdate(
              userId,
              subscriptionData,
              { new: true }
            );

            console.log('Webhook: Updated one-time purchase data:', {
              userId,
              subscriptionData,
              updatedUser: updatedUser?.subscription
            });

            console.log('Webhook: Updated user one-time purchase:', {
              userId,
              subscription: updatedUser?.subscription
            });
          }
        } catch (error) {
          console.error('Webhook: Error updating user subscription:', error);
          throw error;
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          const updateData = {
            $set: {
              'subscription.active': false,
              'subscription.planId': null,
              'subscription.currentPeriodEnd': null,
              'subscription.stripeSubscriptionId': null
            }
          };

          const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
          console.log('Webhook: Cancelled subscription:', {
            userId,
            updateData,
            updatedUser: updatedUser?.subscription
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

    console.log('Checking subscription status for user:', userId);

    const user = await User.findById(userId).select('subscription email');
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeSubscription = null;
    if (user.subscription?.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );
        console.log('Retrieved Stripe subscription:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
        });

        // Verify subscription status matches between DB and Stripe
        if (stripeSubscription.status === 'active' && !user.subscription.active) {
          console.warn('Subscription status mismatch - Stripe: active, DB: inactive');
          // Update local DB to match Stripe
          await User.findByIdAndUpdate(userId, {
            'subscription.active': true,
            'subscription.currentPeriodEnd': new Date(stripeSubscription.current_period_end * 1000)
          });
          user.subscription.active = true;
          user.subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        } else if (stripeSubscription.status !== 'active' && user.subscription.active) {
          console.warn('Subscription status mismatch - Stripe: inactive, DB: active');
          // Update local DB to match Stripe
          await User.findByIdAndUpdate(userId, {
            'subscription.active': false
          });
          user.subscription.active = false;
        }
      } catch (error: any) {
        console.error('Error retrieving Stripe subscription:', error);
        // If Stripe subscription not found, deactivate local subscription
        if (error?.type === 'StripeInvalidRequestError' && error?.statusCode === 404) {
          console.warn('Stripe subscription not found, deactivating local subscription');
          await User.findByIdAndUpdate(userId, {
            'subscription.active': false,
            'subscription.stripeSubscriptionId': null
          });
          user.subscription.active = false;
          user.subscription.stripeSubscriptionId = undefined;
        }
      }
    }

    // Log final subscription status
    console.log('Final subscription status:', {
      userId,
      subscription: user.subscription,
      hasSubscription: !!user.subscription,
      isActive: user.subscription?.active,
      stripeStatus: stripeSubscription?.status
    });

    // Return detailed subscription info
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
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};
