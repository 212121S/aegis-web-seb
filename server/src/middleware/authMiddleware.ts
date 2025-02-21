import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  _id: string;
  email: string;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, jwtSecret) as { _id: string; email: string };
    console.log('Auth Middleware - Decoded Token:', decoded);
    const payload: UserPayload = {
      _id: decoded._id,
      email: decoded.email
    };
    req.user = payload;
    console.log('Auth Middleware - Set User:', req.user);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth error:', error, 'Token:', token);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

// Middleware to check if user has an active subscription
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Example: Check user's subscription status in database
    // const user = await User.findById(req.user?.id);
    // if (!user?.subscription?.active) {
    //   return res.status(403).json({ message: 'Active subscription required' });
    // }
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: 'Failed to verify subscription status' });
  }
};
