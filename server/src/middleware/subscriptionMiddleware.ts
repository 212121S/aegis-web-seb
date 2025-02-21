import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const validateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription || !user.subscription.active) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        message: 'Please subscribe to access this feature'
      });
    }

    next();
  } catch (err) {
    console.error('Subscription validation error:', err);
    return res.status(500).json({ error: 'Failed to validate subscription' });
  }
};
