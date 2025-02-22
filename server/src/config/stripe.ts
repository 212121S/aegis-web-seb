// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_OFFICIAL_TEST_PRICE_ID',
  'STRIPE_BASIC_SUBSCRIPTION_PRICE_ID',
  'STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID'
] as const;

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.warn('Missing Stripe environment variables:', missingEnvVars.join(', '));
}

// Export Stripe configuration
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  prices: {
    officialTest: process.env.STRIPE_OFFICIAL_TEST_PRICE_ID,
    basicSubscription: process.env.STRIPE_BASIC_SUBSCRIPTION_PRICE_ID,
    premiumSubscription: process.env.STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID
  }
};
