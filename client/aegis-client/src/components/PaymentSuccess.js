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
import { useAuth } from '../context/AuthContext';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { refreshSubscription } = useSubscription();
  const { verifyAuth, login } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        console.log('Starting payment verification process...');
        
        let retries = 0;
        const maxRetries = 15; // Increased retries for webhook processing
        const retryDelay = 2000; // 2 seconds between retries

        while (retries < maxRetries) {
          try {
            console.log('Verification attempt', retries + 1);
            
            // First verify auth token is still valid
            const isAuthValid = await verifyAuth();
            if (!isAuthValid) {
              console.log('Auth token invalid, attempting to refresh...');
              const token = localStorage.getItem('token');
              if (token) {
                // Try to reuse existing token
                await login(token);
                console.log('Successfully refreshed auth token');
              } else {
                throw new Error('No token available for refresh');
              }
            }
            
            // Then verify the payment session
            const sessionResponse = await paymentAPI.verifySession(sessionId);
            console.log('Payment session verification:', sessionResponse);
            
            if (sessionResponse?.paymentStatus === 'paid') {
              console.log('Payment confirmed, checking subscription...');
              
              // Give webhook a moment to process
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Check subscription status
              const subscriptionResponse = await refreshSubscription();
              console.log('Subscription status:', subscriptionResponse);
              
              if (subscriptionResponse?.active) {
                console.log('Success: Payment confirmed and subscription active');
                setLoading(false);
                return;
              }
            }

            console.log(`Attempt ${retries + 1}/${maxRetries}: Waiting for subscription activation...`);
            retries++;
            
            if (retries === maxRetries) {
              throw new Error('Payment verified but subscription activation timed out');
            }
            
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } catch (err) {
            console.error('Verification attempt error:', {
              error: err,
              attempt: retries + 1,
              message: err.message,
              stack: err.stack
            });
            
            // If auth error, try to refresh token
            if (err.response?.status === 401) {
              try {
                const token = localStorage.getItem('token');
                if (token) {
                  await login(token);
                  console.log('Successfully refreshed auth token after 401');
                }
              } catch (authErr) {
                console.error('Auth refresh failed:', authErr);
              }
            }
            
            retries++;
            if (retries === maxRetries) {
              throw err;
            }
            
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      } catch (err) {
        console.error('Payment verification failed after all retries:', {
          error: err,
          message: err.message,
          stack: err.stack
        });
        
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
  }, [searchParams, refreshSubscription, verifyAuth, login]);

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
          <Typography variant="body2" color="text.secondary" align="center">
            This may take a few moments. Please do not close this page.
          </Typography>
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
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem'
                  }}
                >
                  Try Again
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
                Your subscription has been activated. You can now access all practice tests.
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
