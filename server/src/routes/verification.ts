import express from 'express';
import { auth } from '../middleware/authMiddleware';
import { VerificationService } from '../services/VerificationService';
import { User } from '../models/User';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Get universities list
router.get('/universities', async (req, res) => {
  console.log('Universities endpoint hit:', {
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  try {
    // Log the attempted file path and current working directory
    const universitiesPath = path.join(__dirname, '..', 'data', 'universities.json');
    console.log('Attempting to read universities from:', universitiesPath);
    const universitiesData = JSON.parse(fs.readFileSync(universitiesPath, 'utf8'));
    console.log('Successfully loaded universities data:', {
      usCount: universitiesData.US.length,
      internationalCount: universitiesData.International.length
    });
    
    // Extract US and UK universities
    const usUniversities = universitiesData.US;
    const ukUniversities = universitiesData.International.filter(
      (uni: any) => uni.country === 'United Kingdom'
    );
    
    // Combine and format universities
    const universities = [...usUniversities, ...ukUniversities];
    
    res.json(universities);
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Send email verification
router.post('/email/send', auth, async (req, res) => {
  try {
    const userId = req.user?._id.toString();
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await VerificationService.sendEmailVerification(userId);
    res.json({ message: 'Email verification sent' });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ error: 'Failed to send email verification' });
  }
});

// Verify email
router.post('/email/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const verified = await VerificationService.verifyEmail(userId, token);
    if (verified) {
      res.json({ message: 'Email verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid verification token' });
    }
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Send phone verification
router.post('/phone/send', auth, async (req, res) => {
  try {
    const userId = req.user?._id.toString();
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    await VerificationService.sendPhoneVerification(userId, phone);
    res.json({ message: 'Phone verification sent' });
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({ error: 'Failed to send phone verification' });
  }
});

// Verify phone
router.post('/phone/verify', auth, async (req, res) => {
  try {
    const userId = req.user?._id.toString();
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }

    const verified = await VerificationService.verifyPhone(userId, code);
    if (verified) {
      res.json({ message: 'Phone verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ error: 'Failed to verify phone' });
  }
});

// Get verification status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const status = await VerificationService.getVerificationStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

export default router;
