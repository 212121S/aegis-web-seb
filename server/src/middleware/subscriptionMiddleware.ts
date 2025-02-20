import { Request, Response, NextFunction } from 'express';
import { User, ISubscription } from '../models/User';
import { UserPayload } from './authMiddleware';

interface AuthenticatedRequest extends Request {
  user?: UserPayload & {
    subscription?: ISubscription;
  };
}

export const requireActiveSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.subscription?.active) {
      return res.status(403).json({
        message: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // Add subscription info to request for use in route handlers
    if (req.user?._id && req.user?.email) {
      req.user = {
        _id: req.user._id,
        email: req.user.email,
        subscription: user.subscription
      };
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: 'Failed to verify subscription status' });
  }
};

// Optional subscription check - doesn't block access but adds subscription status to request
export const checkSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (userId) {
      const user = await User.findById(userId);
      if (user?.subscription && req.user?._id && req.user?.email) {
        req.user = {
          _id: req.user._id,
          email: req.user.email,
          subscription: user.subscription
        };
      }
    }

    next();
  } catch (error) {
    // Log error but don't block request
    console.error('Subscription check error:', error);
    next();
  }
};

// Helper function to check if a subscription is active and not expired
export const isSubscriptionActive = (subscription?: {
  active: boolean;
  currentPeriodEnd?: Date;
}) => {
  if (!subscription?.active) return false;
  if (!subscription.currentPeriodEnd) return false;

  const now = new Date();
  return subscription.active && subscription.currentPeriodEnd > now;
};
