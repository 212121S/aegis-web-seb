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
  LinearProgress,
  Divider
} from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { paymentAPI } from '../utils/axios';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../context/AuthContext';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationProgress, setVerificationProgress] = useState({
    attempt: 0,
    maxAttempts: 5,
    stage: 'initializing',
    message: 'Starting verification...',
    sessionId: null,
    lastError: null,
    startTime: new Date().toISOString()
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

        console.log('Starting payment verification process...', { 
          sessionId,
          timestamp: new Date().toISOString()
        });
        
        setVerificationProgress(prev => ({
          ...prev,
          sessionId,
          stage: 'initialized',
          message: 'Payment verification initialized',
          startTime: new Date().toISOString()
        }));

        // Ensure auth token is still valid
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await verifyAuth();
          } catch (err) {
            console.warn('Auth verification skipped during payment flow:', err);
          }
        }

        // Start payment verification
        setVerificationProgress(prev => ({
          ...prev,
          stage: 'payment',
          message: 'Verifying payment...',
          attempt: 1
        }));

        const sessionResponse = await paymentAPI.verifySession(sessionId);

        // Update progress after successful verification
        setVerificationProgress(prev => ({
          ...prev,
          stage: 'verified',
          message: 'Payment verified successfully',
          lastError: null
        }));
        
        if (sessionResponse?.paymentStatus === 'paid') {
          setVerificationProgress(prev => ({
            ...prev,
            stage: 'subscription',
            message: 'Activating subscription...'
          }));

          // Give webhook more time to process and implement retry logic
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Refresh auth token and subscription status with retries
          await verifyAuth();
          
          let retryCount = 0;
          const maxRetries = 3;
          const baseDelay = 3000;
          
          while (retryCount < maxRetries) {
            console.log(`Attempting subscription verification (attempt ${retryCount + 1}/${maxRetries})`);
            
            const subscriptionResponse = await refreshSubscription();
            
            if (subscriptionResponse?.active) {
              console.log('Payment verification successful:', {
                sessionId,
                attempt: retryCount + 1,
                duration: new Date() - new Date(verificationProgress.startTime),
                timestamp: new Date().toISOString()
              });
              setLoading(false);
              return;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
              const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
              console.log(`Subscription not active yet, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          throw new Error('Subscription not activated after multiple verification attempts');
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification failed:', {
          error: err,
          message: err.message,
          status: err.response?.status,
          duration: new Date() - new Date(verificationProgress.startTime),
          timestamp: new Date().toISOString()
        });
        
        // Use standardized error message from axios interceptor
        let errorMessage = err.message;
        
        // Update progress state to reflect error
        setVerificationProgress(prev => ({
          ...prev,
          stage: 'error',
          lastError: {
            message: errorMessage,
            timestamp: new Date().toISOString()
          }
        }));

        // Set final error state
        setError(errorMessage);
        setLoading(false);

        // Log error details
        console.error('Payment verification failed:', {
          stage: verificationProgress.stage,
          attempts: verificationProgress.attempt,
          duration: new Date() - new Date(verificationProgress.startTime),
          error: errorMessage
        });
      }
    };

    verifyPayment();
  }, [searchParams, refreshSubscription, verifyAuth, login]);

  if (loading) {
    const progress = (verificationProgress.attempt / verificationProgress.maxAttempts) * 100;
    const elapsedTime = new Date() - new Date(verificationProgress.startTime);
    const showExtendedMessage = elapsedTime > 30000; // 30 seconds
    
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
          
          {showExtendedMessage && (
            <>
              <Divider sx={{ width: '100%', my: 2 }} />
              <Typography variant="body2" color="text.secondary" align="center">
                The verification is taking longer than usual. This can happen when:
              </Typography>
              <Box sx={{ width: '100%', mt: 1 }}>
                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                  <li>Payment systems are experiencing high traffic</li>
                  <li>Bank verification is taking longer than normal</li>
                  <li>Network connectivity is unstable</li>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Don't worry - your payment is secure. You can safely refresh this page or check your account status later.
              </Typography>
            </>
          )}
          
          {verificationProgress.lastError && (
            <Alert 
              severity="info" 
              sx={{ 
                width: '100%', 
                mt: 2,
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                Temporary issue detected: {verificationProgress.lastError.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Retrying verification...
              </Typography>
            </Alert>
          )}
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
              <Warning
                sx={{
                  fontSize: 64,
                  color: theme.palette.warning.main,
                  mb: 2
                }}
              />
              <Typography variant="h5" gutterBottom>
                Payment Verification Issue
              </Typography>
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Need help? Contact our support team
              </Typography>
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
