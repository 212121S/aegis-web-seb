import express, { Request, Response } from 'express';
import { auth } from '../middleware/authMiddleware';
import { VerificationService } from '../services/VerificationService';
import { User } from '../models/User';

const router = express.Router();

router.post('/email/send', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await VerificationService.sendEmailVerification(req.user._id.toString(), user.email);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

router.post('/email/verify/:token', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    await VerificationService.verifyEmail(token);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

router.post('/email/resend', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await VerificationService.resendEmailVerification(req.user._id.toString());
    res.json({ message: 'Verification email resent' });
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

router.post('/phone/send', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.phone) {
      res.status(400).json({ error: 'Phone number not found' });
      return;
    }

    await VerificationService.sendPhoneVerification(req.user._id.toString(), user.phone);
    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/phone/verify', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { code } = req.body;
    await VerificationService.verifyPhone(req.user._id.toString(), code);
    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Error verifying phone:', error);
    res.status(500).json({ error: 'Failed to verify phone' });
  }
});

router.post('/phone/resend', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await VerificationService.resendPhoneVerification(req.user._id.toString());
    res.json({ message: 'Verification code resent' });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

export default router;
