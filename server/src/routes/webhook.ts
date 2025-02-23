import express from 'express';
import { handleWebhook } from '../controllers/paymentController';

const router = express.Router();

// Webhook handler - raw body parsing is handled at the app level
router.post('/', handleWebhook);

export default router;
