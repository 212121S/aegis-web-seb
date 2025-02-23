import { Request, Response } from 'express';
import { User } from '../models/User';
import Stripe from 'stripe';
import { stripeConfig } from '../config/stripe';

// Initialize Stripe with configuration
const STRIPE_SECRET_KEY = stripeConfig.secretKey;
const STRIPE_PRICE_IDS = stripeConfig.prices;

// Log Stripe configuration
console.log('Stripe Configuration:', {
  secretKeyConfigured: !!STRIPE_SECRET_KEY,
  priceIds: {
    officialTest: STRIPE_PRICE_IDS.officialTest,
    basicSubscription: STRIPE_PRICE_IDS.basicSubscription,
    premiumSubscription: STRIPE_PRICE_IDS.premiumSubscription
  },
  timestamp: new Date().toISOString()
});

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia'
  });
  console.log('✓ Stripe initialized successfully');
} else {
  console.warn('⚠️  Stripe not configured - payment features will be disabled');
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

    // Debug log price IDs
    console.log('Price IDs:', {
      officialTest: STRIPE_PRICE_IDS.officialTest,
      basic: STRIPE_PRICE_IDS.basicSubscription,
      premium: STRIPE_PRICE_IDS.premiumSubscription,
      timestamp: new Date().toISOString()
    });

    // Debug log price validation
    console.log('Price validation:', {
      provided: priceId,
      officialTest: STRIPE_PRICE_IDS.officialTest,
      basicSubscription: STRIPE_PRICE_IDS.basicSubscription,
      premiumSubscription: STRIPE_PRICE_IDS.premiumSubscription,
      timestamp: new Date().toISOString()
    });

    // Check if the provided priceId matches any of our valid price IDs
    if (priceId !== STRIPE_PRICE_IDS.officialTest && 
        priceId !== STRIPE_PRICE_IDS.basicSubscription && 
        priceId !== STRIPE_PRICE_IDS.premiumSubscription) {
      console.error('Invalid price ID:', {
        providedPriceId: priceId,
        officialTest: STRIPE_PRICE_IDS.officialTest,
        basic: STRIPE_PRICE_IDS.basicSubscription,
        premium: STRIPE_PRICE_IDS.premiumSubscription,
        timestamp: new Date().toISOString()
      });
      res.status(400).json({ error: 'Invalid price ID' });
      return;
    }

    // Determine mode based on price ID
    const mode = priceId === STRIPE_PRICE_IDS.officialTest ? 'payment' : 'subscription';
    const type = priceId === STRIPE_PRICE_IDS.officialTest ? 'officialTest' :
                 priceId === STRIPE_PRICE_IDS.basicSubscription ? 'basicSubscription' : 'premiumSubscription';

    // Log checkout details
    console.log('Creating checkout session:', {
      priceId,
      type,
      mode,
      timestamp: new Date().toISOString()
    });

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

    console.log('Creating checkout session:', {
      userId: userId.toString(),
      priceId,
      isOfficialTest: priceId === STRIPE_PRICE_IDS.officialTest
    });

    const session = await (stripe as Stripe).checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode,
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: userId.toString(),
        priceId: priceId
      }
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      userId: userId.toString(),
      priceId
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?._id,
      priceId: req.body?.priceId
    });
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkStripeAvailable(res)) return;
    const sig = req.headers['stripe-signature'];
    if (!sig || !stripeConfig.webhookSecret) {
      res.status(400).json({ error: 'Missing signature or webhook secret' });
      return;
    }

    console.log('Received webhook request:', {
      signature: !!sig,
      signatureHeader: sig,
      hasSecret: !!stripeConfig.webhookSecret,
      webhookSecret: stripeConfig.webhookSecret,
      body: typeof req.body === 'string' ? 'string' : typeof req.body,
      bodyLength: typeof req.body === 'string' ? req.body.length : JSON.stringify(req.body).length,
      timestamp: new Date().toISOString()
    });

    const event = (stripe as Stripe).webhooks.constructEvent(
      req.body,
      sig,
      stripeConfig.webhookSecret
    );

    console.log('Processing webhook event:', {
      type: event.type,
      objectType: (event.data.object as any).object,
      objectId: (event.data.object as any).id,
      hasMetadata: !!(event.data.object as any).metadata,
      timestamp: new Date().toISOString()
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        
        if (!userId) {
          console.error('Missing userId in session metadata');
          break;
        }

        console.log('Processing completed checkout:', {
          userId,
          priceId,
          mode: session.mode
        });

        if (session.mode === 'subscription') {
          console.log('Processing subscription checkout:', {
            userId,
            customerId: session.customer,
            subscriptionId: session.subscription,
            planId: priceId === STRIPE_PRICE_IDS.basicSubscription ? 'basic' : 'premium',
            metadata: session.metadata,
            paymentStatus: session.payment_status,
            status: session.status,
            timestamp: new Date().toISOString()
          });

          // Update subscription record in database with all fields in one atomic operation
          const updateResult = await User.findByIdAndUpdate(
            userId,
            {
              'subscription.stripeCustomerId': session.customer,
              'subscription.stripeSubscriptionId': session.subscription,
              'subscription.plan': priceId === STRIPE_PRICE_IDS.basicSubscription ? 'basic' : 'premium',
              'subscription.active': true,
              'subscription.startDate': new Date(),
              'subscription.currentPeriodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            { new: true }
          );

          if (!updateResult) {
            console.error('Failed to update user subscription:', {
              userId,
              subscriptionId: session.subscription,
              timestamp: new Date().toISOString()
            });
          } else {
            console.log('Subscription activated:', {
              userId,
              subscriptionId: session.subscription,
              plan: updateResult.subscription?.plan,
              active: updateResult.subscription?.active,
              startDate: updateResult.subscription?.startDate,
              currentPeriodEnd: updateResult.subscription?.currentPeriodEnd,
              timestamp: new Date().toISOString()
            });
          }
        } else if (session.mode === 'payment') {
          // Handle one-time payment for official test
          await User.findByIdAndUpdate(userId, {
            $inc: { 'officialTestCredits': 1 }
          });
          console.log('Official test credit added:', { userId });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': subscription.id },
          { 'subscription.active': false }
        );
        console.log('Subscription deactivated:', { subscriptionId: subscription.id });
        break;
      }
    }

    res.json({ 
      received: true,
      type: event.type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      headers: req.headers
    });
    res.status(400).json({ 
      error: 'Webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    console.log('Verifying session:', { sessionId });

    try {
      // Retrieve session
      const session = await (stripe as Stripe).checkout.sessions.retrieve(sessionId);

      if (!session) {
        console.error('Session not found:', { sessionId });
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Validate session status and payment
      if (session.status !== 'complete' || session.payment_status !== 'paid') {
        console.error('Session validation failed:', { 
          sessionId,
          status: session.status,
          paymentStatus: session.payment_status
        });
        res.status(400).json({ error: 'Payment not completed' });
        return;
      }

      // For subscription mode, check if subscription is ready
      if (session.mode === 'subscription') {
        // Get subscription ID from session
        if (!session.subscription) {
          console.log('No subscription ID in session:', {
            sessionId,
            timestamp: new Date().toISOString()
          });
          res.status(202).json({ 
            status: 'processing',
            message: 'Subscription is being processed',
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        // Check if user's subscription is updated in our database
        const user = await User.findOne({
          'subscription.stripeSubscriptionId': session.subscription,
          'subscription.active': true
        });

        if (!user) {
          console.log('Subscription not yet updated in database:', {
            sessionId,
            subscriptionId: session.subscription,
            timestamp: new Date().toISOString()
          });
          res.status(202).json({ 
            status: 'processing',
            message: 'Finalizing subscription activation',
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        console.log('Subscription verified in database:', {
          sessionId,
          subscriptionId: session.subscription,
          userId: user._id,
          active: user.subscription?.active,
          plan: user.subscription?.plan,
          timestamp: new Date().toISOString()
        });
      }

      console.log('Session verified successfully:', {
        sessionId,
        paymentStatus: session.payment_status,
        status: session.status,
        mode: session.mode,
        customerId: session.customer,
        subscriptionId: session.subscription,
        timestamp: new Date().toISOString()
      });

      // Return success response with subscription details
      res.json({ 
        paymentStatus: session.payment_status,
        status: 'success',
        mode: session.mode,
        customerId: session.customer,
        subscriptionId: session.subscription,
        verifiedAt: new Date().toISOString(),
        subscription: session.mode === 'subscription' ? {
          active: true,
          status: 'active',
          customerId: session.customer,
          subscriptionId: session.subscription
        } : undefined
      });
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError) {
        console.error('Stripe error during session verification:', {
          type: err.type,
          code: err.code,
          message: err.message,
          sessionId
        });
        res.status(400).json({ error: 'Payment verification failed', details: err.message });
        return;
      }
      throw err;
    }
  } catch (error) {
    console.error('Error verifying session:', {
      error,
      sessionId: req.params.sessionId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({ 
      error: 'Failed to verify session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
