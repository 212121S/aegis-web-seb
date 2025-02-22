import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import config from '../config';
import { paymentAPI } from '../utils/axios';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripeError, setStripeError] = useState(null);

  useEffect(() => {
    // Check if Stripe is configured
    if (!config.stripe.publicKey) {
      setStripeError('Payment system is not properly configured. Please try again later.');
      console.error('Stripe public key is not configured');
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!config.stripe.publicKey) {
        throw new Error('Payment system is not configured');
      }

      const stripe = await loadStripe(config.stripe.publicKey);
      if (!stripe) {
        throw new Error('Failed to initialize payment system');
      }

      // Create checkout session
      const response = await paymentAPI.createCheckoutSession();
      const { sessionId } = response.data;

      // Redirect to checkout
      const result = await stripe.redirectToCheckout({
        sessionId
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscribe to Aegis
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Get unlimited access to practice tests and study materials.
        </Typography>
      </Box>

      {stripeError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {stripeError}
        </Alert>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Premium Subscription
          </Typography>
          <Typography variant="h4" component="p" gutterBottom>
            $49.99/month
          </Typography>
          <Typography variant="body1" paragraph>
            ✓ Unlimited practice tests
          </Typography>
          <Typography variant="body1" paragraph>
            ✓ Detailed performance analytics
          </Typography>
          <Typography variant="body1" paragraph>
            ✓ Study guides and materials
          </Typography>
          <Typography variant="body1" paragraph>
            ✓ Priority support
          </Typography>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleSubscribe}
            disabled={loading || stripeError}
            sx={{ mt: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Subscribe Now'
            )}
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Secure payments powered by Stripe
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Cancel anytime • No hidden fees
        </Typography>
      </Box>
    </Container>
  );
};

export default PaymentPage;
