import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Alert,
  useTheme
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { paymentAPI } from '../utils/axios';
import { useSubscription } from '../hooks/useSubscription';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        let retries = 0;
        const maxRetries = 10; // More retries since webhook processing can take time
        const retryDelay = 2000; // 2 seconds between retries

        while (retries < maxRetries) {
          try {
            console.log('Attempting verification - Attempt', retries + 1);
            
            // First verify the session
            const sessionResponse = await paymentAPI.verifySession(sessionId);
            console.log('Session verification response:', sessionResponse);
            
            // Then check subscription status
            const subscriptionResponse = await refreshSubscription();
            console.log('Subscription check response:', subscriptionResponse);
            
            // Consider success if either:
            // 1. Subscription is active
            // 2. Session payment status is 'paid' (for one-time purchases)
            if (subscriptionResponse?.active || sessionResponse?.paymentStatus === 'paid') {
              console.log('Verification successful - Payment confirmed');
              setLoading(false);
              return;
            }

            // If payment is confirmed but subscription not active yet
            if (sessionResponse?.paymentStatus === 'paid') {
              console.log('Payment confirmed but waiting for subscription activation');
            }

            retries++;
            if (retries === maxRetries) {
              throw new Error('Payment verified but subscription activation timed out');
            }
            
            console.log(`Attempt ${retries}/${maxRetries}: Waiting ${retryDelay}ms before next check...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } catch (err) {
            console.error('Verification attempt failed:', err);
            retries++;
            if (retries === maxRetries) {
              throw err;
            }
            console.log(`Attempt ${retries}/${maxRetries}: Retrying after error...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      } catch (err) {
        console.error('Payment verification failed after all retries:', err);
        const isPaymentConfirmed = err.message?.includes('subscription activation timed out');
        
        setError(
          isPaymentConfirmed
            ? 'Your payment was successful but subscription activation is taking longer than expected. ' +
              'Please refresh the page in a few moments or check your account page.'
            : 'There was an issue verifying your payment. If you completed the payment, ' +
              'please check your account page or contact support.'
        );
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, refreshSubscription]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6">Verifying your payment...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <>
              <CheckCircle
                sx={{
                  fontSize: 64,
                  color: theme.palette.success.main,
                  mb: 2
                }}
              />
              <Typography variant="h4" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography color="text.secondary" paragraph>
                Thank you for your purchase. Please wait a moment while we activate your subscription.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/test/practice')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem'
                  }}
                >
                  Start Practice Tests
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/account')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem'
                  }}
                >
                  View Account
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default PaymentSuccess;
