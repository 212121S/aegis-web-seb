import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion
});

export const validateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get test type from request
    const testType = req.body.type || req.query.type;
    
    console.log('Subscription Check:', {
      path: req.path,
      testType,
      body: req.body,
      query: req.query
    });

    // Skip subscription check for official tests
    if (testType === 'official') {
      console.log('Skipping subscription check for official test');
      return next();
    }

    const user = await User.findById(req.user!._id).select('subscription email');
    
    if (!user) {
      console.error('User not found:', req.user!._id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Checking subscription access:', {
      userId: user._id,
      subscription: user.subscription,
      hasSubscription: !!user.subscription,
      isActive: user.subscription?.active
    });

    // If no subscription record exists
    if (!user.subscription) {
      console.log('No subscription record found');
      return res.status(403).json({ 
        error: 'Active subscription required',
        message: 'Please subscribe to access practice tests'
      });
    }

    // For subscription plans, verify with Stripe
    if (user.subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );
        
        console.log('Retrieved Stripe subscription:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
        });

        // Handle subscription status mismatch
        if (stripeSubscription.status === 'active' && !user.subscription.active) {
          console.warn('Fixing subscription status mismatch - Stripe: active, DB: inactive');
          await User.findByIdAndUpdate(user._id, {
            'subscription.active': true,
            'subscription.currentPeriodEnd': new Date(stripeSubscription.current_period_end * 1000)
          });
          user.subscription.active = true;
        } else if (stripeSubscription.status !== 'active' && user.subscription.active) {
          console.warn('Fixing subscription status mismatch - Stripe: inactive, DB: active');
          await User.findByIdAndUpdate(user._id, {
            'subscription.active': false
          });
          user.subscription.active = false;
        }
      } catch (error: any) {
        console.error('Error verifying Stripe subscription:', error);
        
        // If Stripe subscription not found, deactivate local subscription
        if (error?.type === 'StripeInvalidRequestError' && error?.statusCode === 404) {
          console.warn('Stripe subscription not found, deactivating local subscription');
          await User.findByIdAndUpdate(user._id, {
            'subscription.active': false,
            'subscription.stripeSubscriptionId': null
          });
          user.subscription.active = false;
        }
      }
    }

    // Final subscription status check
    if (!user.subscription.active) {
      console.log('Subscription not active, denying access');
      return res.status(403).json({ 
        error: 'Active subscription required',
        message: 'Please subscribe to access practice tests'
      });
    }

    console.log('Subscription validated successfully');
    next();
  } catch (err) {
    console.error('Subscription validation error:', err);
    return res.status(500).json({ error: 'Failed to validate subscription' });
  }
};
