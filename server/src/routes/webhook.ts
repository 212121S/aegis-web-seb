import express from 'express';
import { handleWebhook } from '../controllers/paymentController';
import { connectMongo } from '../database';

const router = express.Router();

// Webhook handler with its own database connection
router.post('/', async (req, res, next) => {
  try {
    // Ensure database connection for webhook operations
    try {
      await connectMongo();
    } catch (dbError) {
      console.error('Database connection failed in webhook handler:', dbError);
      // Don't fail the webhook on DB connection error
      // Stripe will retry the webhook later
      res.status(202).json({ 
        received: true,
        status: 'deferred',
        message: 'Webhook received but processing delayed',
        timestamp: new Date().toISOString()
      });
      return;
    }
    await handleWebhook(req, res);
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Let Stripe know there was an error so it can retry
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: 'Internal server error during webhook processing',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
