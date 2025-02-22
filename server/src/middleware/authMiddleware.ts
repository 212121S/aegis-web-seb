import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-key-for-development';
console.warn(process.env.JWT_SECRET ? '✓ JWT_SECRET configured' : '⚠️  Using default JWT_SECRET - not secure for production');

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Auth Middleware - Headers:', req.headers);
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('Auth Middleware - No authorization header');
      res.status(401).json({ error: 'No token found' });
      return;
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Auth Middleware - Invalid token format');
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth Middleware - No token after Bearer');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    console.log('Auth Middleware - Verifying token');
    const decoded = jwt.verify(token, JWT_SECRET) as { _id: string };
    console.log('Auth Middleware - Token decoded:', decoded);

    const user = await User.findById(decoded._id);
    if (!user) {
      console.log('Auth Middleware - User not found');
      res.status(401).json({ error: 'User not found' });
      return;
    }

    console.log('Auth Middleware - User found:', { userId: user._id });
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware - Error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { _id: string };
    const user = await User.findById(decoded._id);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't return error for optional auth
    next();
  }
};
