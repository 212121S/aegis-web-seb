import express from 'express';
import { auth } from '../middleware/authMiddleware';
import { VerificationService } from '../services/VerificationService';
import { User } from '../models/User';
import CollegeScorecardService from '../services/CollegeScorecardService';

const router = express.Router();

// Get universities list with search and pagination
router.get('/universities', async (req: express.Request, res: express.Response) => {
  try {
    const query = req.query.q as string || '';
    const page = parseInt(req.query.page as string || '0', 10);
    const perPage = parseInt(req.query.per_page as string || '100', 10);

    const collegeService = CollegeScorecardService.getInstance();
    const result = await collegeService.searchUniversities(query, page, perPage);

    return res.json({
      universities: result.universities,
      pagination: {
        total: result.total,
        page: result.page,
        per_page: result.perPage
      }
    });
  } catch (error) {
    console.error('Get universities error:', error);
    return res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Refresh university cache (admin only)
router.post('/universities/refresh', auth, async (req: express.Request, res: express.Response) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user?._id);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const collegeService = CollegeScorecardService.getInstance();
    await collegeService.refreshCache();

    return res.json({ message: 'University cache refreshed successfully' });
  } catch (error) {
    console.error('Refresh universities error:', error);
    return res.status(500).json({ error: 'Failed to refresh universities' });
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
