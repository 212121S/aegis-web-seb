import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface UserPayload {
  _id: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticateToken = async (
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

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId)
      .select('_id email phone emailVerified phoneVerified')
      .lean();

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const payload: UserPayload = {
      _id: user._id.toString(),
      email: user.email as string,
      phone: user.phone as string,
      emailVerified: user.emailVerified as boolean,
      phoneVerified: user.phoneVerified as boolean
    };


    req.user = payload;
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
    const user = await User.findById(req.user?._id);
    if (!user?.subscription?.active) {
      return res.status(403).json({ message: 'Active subscription required' });
    }
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: 'Failed to verify subscription status' });
  }
};

// Middleware to check if email is verified
export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ message: 'Email verification required' });
  }
  next();
};

// Middleware to check if phone is verified
export const requirePhoneVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.phoneVerified) {
    return res.status(403).json({ message: 'Phone verification required' });
  }
  next();
};
