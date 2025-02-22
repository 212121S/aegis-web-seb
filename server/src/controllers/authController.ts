import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { TestResult } from '../models/Question';

const generateToken = (userId: string | mongoose.Types.ObjectId | unknown): string => {
  const id = userId instanceof mongoose.Types.ObjectId ? userId.toString() : String(userId);
  return jwt.sign({ userId: id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h',
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user with verification flags set to true for testing
    const user = new User({
      email,
      password,
      username,
      phone,
      emailVerified: true,
      phoneVerified: true,
      tosAccepted: true,
      tosAcceptedDate: new Date()
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .select('-password')
      .populate('testHistory.testId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get official test history
    const officialTests = user.testHistory.filter(test => test.type === 'official');
    
    // Calculate statistics
    const scores = officialTests.map(test => test.score);
    const highestScore = Math.max(...scores, 0);
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    // Update user statistics if they've changed
    if (user.highestScore !== highestScore || user.averageScore !== averageScore) {
      user.highestScore = highestScore;
      user.averageScore = averageScore;
      await user.save();
    }

    res.json({ 
      user,
      testStats: {
        highestScore,
        averageScore,
        totalTests: officialTests.length
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { username, email, phone } = req.body;

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Failed to verify token' });
  }
};

export const getUserVerification = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token })
      .select('username email phone highestScore averageScore testHistory')
      .populate('testHistory.testId');

    if (!user) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    // Filter for only official tests
    const officialTests = user.testHistory.filter(test => test.type === 'official');

    res.json({
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone,
        highestScore: user.highestScore,
        averageScore: user.averageScore,
        testHistory: officialTests
      }
    });
  } catch (err) {
    console.error('Get verification error:', err);
    res.status(500).json({ error: 'Failed to get verification' });
  }
};

export const regenerateVerificationToken = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new token
    user.verificationToken = crypto.randomBytes(32).toString('hex');
    await user.save();

    res.json({ verificationToken: user.verificationToken });
  } catch (err) {
    console.error('Regenerate token error:', err);
    res.status(500).json({ error: 'Failed to regenerate verification token' });
  }
};

export const addTestResult = async (req: Request, res: Response) => {
  try {
    const { testId, score, type } = req.body;
    const user = await User.findById(req.user!._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add test to history
    user.testHistory.push({
      testId,
      score,
      date: new Date(),
      type
    });

    // Update statistics for official tests
    if (type === 'official') {
      const officialTests = user.testHistory.filter(test => test.type === 'official');
      const scores = officialTests.map(test => test.score);
      
      user.highestScore = Math.max(...scores, user.highestScore);
      user.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    await user.save();

    res.json({ 
      message: 'Test result added successfully',
      testHistory: user.testHistory
    });
  } catch (err) {
    console.error('Add test result error:', err);
    res.status(500).json({ error: 'Failed to add test result' });
  }
};
