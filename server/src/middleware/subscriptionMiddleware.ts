import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

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

    const user = await User.findById(req.user!._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User subscription status:', {
      userId: user._id,
      subscription: user.subscription,
      hasSubscription: !!user.subscription,
      isActive: user.subscription?.active
    });

    if (!user.subscription || !user.subscription.active) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        message: 'Please subscribe to access practice tests'
      });
    }

    next();
  } catch (err) {
    console.error('Subscription validation error:', err);
    return res.status(500).json({ error: 'Failed to validate subscription' });
  }
};
