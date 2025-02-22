import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface UserDocument extends IUser {
  _id: Types.ObjectId;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-key-for-development';
console.warn(process.env.JWT_SECRET ? '✓ JWT_SECRET configured' : '⚠️  Using default JWT_SECRET - not secure for production');

const generateToken = (userId: Types.ObjectId | string): string => {
  return jwt.sign({ _id: userId.toString() }, JWT_SECRET, { expiresIn: '24h' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password') as UserDocument | null;
    if (!user) {
      console.log('Login failed: User not found');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id);
    console.log('Login successful:', { userId: user._id });

    // Remove sensitive data before sending response
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified
    };

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Registration attempt:', { email: req.body.email });
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Registration failed: Email already exists');
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      emailVerified: false,
      phoneVerified: false,
      subscription: {
        active: false
      },
      testHistory: [],
      testResults: [],
      highestScore: 0,
      averageScore: 0
    }) as UserDocument;

    const token = generateToken(user._id);
    console.log('Registration successful:', { userId: user._id });

    // Remove sensitive data before sending response
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified
    };

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Token verification attempt');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('Token verification failed: No token provided');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { _id: string };
    console.log('Token decoded:', decoded);

    const user = await User.findById(decoded._id) as UserDocument | null;
    if (!user) {
      console.log('Token verification failed: User not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log('Token verification successful:', { userId: user._id });
    res.json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as UserDocument)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId) as UserDocument | null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive data before sending response
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as UserDocument)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }) as UserDocument | null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive data before sending response
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getUserVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as UserDocument)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId) as UserDocument | null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      verificationToken: user.verificationToken
    });
  } catch (error) {
    console.error('Get verification error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};

export const regenerateVerificationToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as UserDocument)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId) as UserDocument | null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const verificationToken = Math.random().toString(36).substring(2, 15);
    user.verificationToken = verificationToken;
    await user.save();

    res.json({ verificationToken });
  } catch (error) {
    console.error('Regenerate token error:', error);
    res.status(500).json({ error: 'Failed to regenerate verification token' });
  }
};

export const addTestResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as UserDocument)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { score, date } = req.body;
    const user = await User.findById(userId) as UserDocument | null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.testResults = user.testResults || [];
    user.testResults.push({ score, date });
    await user.save();

    res.json({ message: 'Test result added successfully' });
  } catch (error) {
    console.error('Add test result error:', error);
    res.status(500).json({ error: 'Failed to add test result' });
  }
};
