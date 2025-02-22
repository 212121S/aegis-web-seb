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
  useTheme,
  LinearProgress
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { paymentAPI } from '../utils/axios';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../context/AuthContext';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationProgress, setVerificationProgress] = useState({
    attempt: 0,
    maxAttempts: 20,
    stage: 'initializing',
    message: 'Starting verification...'
  });
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
        const maxRetries = 20; // Increased max retries
        const initialRetryDelay = 2000; // Initial delay of 2 seconds
        const maxRetryDelay = 8000; // Max delay of 8 seconds
        
        // Exponential backoff with jitter
        const getRetryDelay = (attempt) => {
          const exponentialDelay = Math.min(initialRetryDelay * Math.pow(1.5, attempt), maxRetryDelay);
          const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
          return exponentialDelay + jitter;
        };

        while (retries < maxRetries) {
          const currentDelay = getRetryDelay(retries);
          try {
            setVerificationProgress(prev => ({
              ...prev,
              attempt: retries + 1,
              stage: 'verifying',
              message: `Verifying payment (Attempt ${retries + 1}/${maxRetries})...`
            }));

            console.log('Verification attempt', {
              attempt: retries + 1,
              maxAttempts: maxRetries,
              delay: Math.round(currentDelay),
              sessionId
            });
            
            // First ensure we have a valid auth token
            try {
              setVerificationProgress(prev => ({
                ...prev,
                stage: 'auth',
                message: 'Validating authentication...'
              }));

              const isAuthValid = await verifyAuth();
              if (!isAuthValid) {
                console.log('Auth validation failed, attempting token refresh...', {
                  attempt: retries + 1,
                  hasToken: !!localStorage.getItem('token')
                });
                const token = localStorage.getItem('token');
                if (token) {
                  await login(token);
                  console.log('Successfully refreshed auth token');
                } else {
                  throw new Error('No token available for refresh');
                }
              }
            } catch (authError) {
              console.error('Auth verification failed:', authError);
              // Continue anyway - the payment verification might still work
            }
            
            // Verify the payment session with timeout
            let sessionResponse;
            try {
              setVerificationProgress(prev => ({
                ...prev,
                stage: 'payment',
                message: 'Verifying payment status...'
              }));

              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Verification request timeout')), 30000)
              );
              sessionResponse = await Promise.race([
                paymentAPI.verifySession(sessionId),
                timeoutPromise
              ]);
            } catch (verifyError) {
              console.error('Session verification failed:', {
                error: verifyError,
                attempt: retries + 1,
                status: verifyError.response?.status,
                isTimeout: verifyError.message === 'Verification request timeout'
              });
              
              // Retry on server errors or timeouts
              if (verifyError.response?.status === 500 || verifyError.message === 'Verification request timeout') {
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                continue;
              }
              throw verifyError;
            }
            console.log('Payment session verification:', {
              status: sessionResponse?.paymentStatus,
              attempt: retries + 1
            });
            
            if (sessionResponse?.paymentStatus === 'paid') {
              setVerificationProgress(prev => ({
                ...prev,
                stage: 'subscription',
                message: 'Activating subscription...'
              }));

              console.log('Payment confirmed, checking subscription...');
              
              // Give webhook a moment to process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Check subscription status
              let subscriptionResponse;
              try {
                subscriptionResponse = await refreshSubscription();
              } catch (subError) {
                console.error('Subscription check failed:', subError);
                if (subError.response?.status === 500) {
                  // If server error, wait and retry
                  await new Promise(resolve => setTimeout(resolve, currentDelay));
                  continue;
                }
                throw subError;
              }
              console.log('Subscription status:', subscriptionResponse);
              
              if (subscriptionResponse?.active) {
                console.log('Success: Payment confirmed and subscription active');
                setLoading(false);
                return;
              }
            }

            console.log('Subscription activation pending:', {
              attempt: retries + 1,
              maxAttempts: maxRetries,
              nextDelay: Math.round(getRetryDelay(retries + 1)),
              sessionId
            });
            retries++;
            
            if (retries === maxRetries) {
              throw new Error('Payment verified but subscription activation timed out');
            }
            
            await new Promise(resolve => setTimeout(resolve, currentDelay));
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
            
            await new Promise(resolve => setTimeout(resolve, currentDelay));
          }
        }
      } catch (err) {
        console.error('Payment verification failed after all retries:', {
          error: err,
          message: err.message,
          stack: err.stack
        });
        
        const isPaymentConfirmed = err.message?.includes('subscription activation timed out');
        const isTimeout = err.message === 'Verification request timeout';
        
        let errorMessage;
        if (isPaymentConfirmed) {
          errorMessage = 'Your payment was successful but subscription activation is taking longer than expected. ' +
                        'Please refresh the page in a few moments or check your account page.';
        } else if (isTimeout) {
          errorMessage = 'The verification request is taking longer than expected. ' +
                        'Your payment may still be processing. Please refresh or check your account page.';
        } else {
          errorMessage = 'There was an issue verifying your payment. If you completed the payment, ' +
                        'please check your account page or contact support if the issue persists.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, refreshSubscription, verifyAuth, login]);

  if (loading) {
    const progress = (verificationProgress.attempt / verificationProgress.maxAttempts) * 100;
    
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
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4
                }
              }}
            />
          </Box>
          <Typography variant="body1" color="primary" align="center" sx={{ fontWeight: 500 }}>
            {verificationProgress.message}
          </Typography>
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
