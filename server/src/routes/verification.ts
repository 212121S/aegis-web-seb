import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { VerificationService } from '../services/VerificationService';

const router = express.Router();

// Email verification routes
router.post('/email/send', authenticateToken, async (req, res) => {
  try {
    await VerificationService.sendEmailVerification(req.user!._id, req.user!.email);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

router.get('/email/verify/:token', async (req, res) => {
  try {
    await VerificationService.verifyEmail(req.params.token);
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid verification token' });
  }
});

router.post('/email/resend', authenticateToken, async (req, res) => {
  try {
    await VerificationService.resendEmailVerification(req.user!._id);
    res.json({ message: 'Verification email resent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Phone verification routes
router.post('/phone/send', authenticateToken, async (req, res) => {
  try {
    await VerificationService.sendPhoneVerification(req.user!._id, req.user!.phone);
    res.json({ message: 'Verification SMS sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send verification SMS' });
  }
});

router.post('/phone/verify', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    await VerificationService.verifyPhone(req.user!._id, code);
    res.json({ message: 'Phone verified successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid verification code' });
  }
});

router.post('/phone/resend', authenticateToken, async (req, res) => {
  try {
    await VerificationService.resendPhoneVerification(req.user!._id);
    res.json({ message: 'Verification SMS resent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification SMS' });
  }
});

// University routes
router.get('/universities', async (_req, res) => {
  try {
    const { University } = require('../models/University');
    const universities = await University.find().sort('name');
    res.json(universities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

export default router;
