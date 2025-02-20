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
import axios from 'axios';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:4000/api/payment/verify-session',
          { sessionId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setLoading(false);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

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
                Thank you for your purchase. Your subscription is now active.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/test')}
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
