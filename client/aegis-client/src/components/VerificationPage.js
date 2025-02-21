import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import {
  Assessment,
  Timer,
  Psychology,
  TrendingUp,
  VerifiedUser
} from '@mui/icons-material';
import { verificationService } from '../services/VerificationService';

const VerificationPage = () => {
  const theme = useTheme();
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [verifyByCode, setVerifyByCode] = useState(false);
  const [code, setCode] = useState('');

  const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
  };

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        if (token) {
          const data = await verificationService.verifyByToken(token);
          setResult(data);
        }
      } catch (err) {
        setError(verificationService.formatError(err));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchVerification();
    } else {
      setVerifyByCode(true);
      setLoading(false);
    }
  }, [token]);

  const handleVerifyByCode = async () => {
    if (!code) return;

    setLoading(true);
    try {
      const data = await verificationService.verifyByCode(code);
      setResult(data);
      setError(null);
    } catch (err) {
      setError(verificationService.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    handleVerifyByCode();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" color="text.secondary">
            {token ? "Verifying Results..." : "Loading..."}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (verifyByCode && !result) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <VerifiedUser sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
              Verify Test Results
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
              Enter the verification code provided by the candidate
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleCodeSubmit}>
            <TextField
              fullWidth
              label="Verification Code"
              variant="outlined"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., XXXX-XXXX-XXXX)"
              sx={{ mb: 3 }}
              InputProps={{
                sx: { 
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  letterSpacing: '0.1em'
                }
              }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={!code}
              sx={{ py: 1.5 }}
            >
              Verify Results
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
          No verification data found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <VerifiedUser sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h3" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
          Verified Test Results
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
          Official Aegis Testing Technology Assessment Results
        </Typography>
      </Box>

      {/* Main Results Card */}
      <Paper sx={{ ...glassmorphismStyle, p: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              Candidate Information
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontFamily: 'Inter, sans-serif' }}>
                <strong>Name:</strong> {result.candidateName}
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'Inter, sans-serif' }}>
                <strong>Test Date:</strong> {new Date(result.testDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'Inter, sans-serif' }}>
                <strong>Duration:</strong> {result.testDuration}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                textAlign: 'center',
                p: 3,
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: 2
              }}
            >
              <Typography variant="h3" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
                {result.finalScore.toFixed(1)}
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'Inter, sans-serif' }}>
                Percentile: {result.percentile}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance Breakdown */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              Performance Breakdown
            </Typography>
            
            {result.questionBreakdown.map((category, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    {category.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
                    {category.correct}/{category.total} ({((category.correct/category.total)*100).toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(category.correct/category.total)*100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(26, 35, 126, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ ...glassmorphismStyle, p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              Test Analytics
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Psychology sx={{ color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                      {result.averageDifficulty.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
                      Avg. Difficulty
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Timer sx={{ color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                      {result.timePerQuestion}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
                      Avg. Time/Q
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Chip
                icon={<VerifiedUser />}
                label="Officially Verified"
                color="success"
                sx={{ fontFamily: 'Inter, sans-serif' }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Note */}
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mt: 4, 
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontStyle: 'italic'
        }}
      >
        This is an official verification page from Aegis Testing Technology. 
        Results are encrypted and tamper-proof.
      </Typography>
    </Container>
  );
};

export default VerificationPage;
