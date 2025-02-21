import React, { useState, useEffect } from 'react';
import { verificationService } from '../services/VerificationService';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  Link
} from '@mui/material';
import {
  ContentCopy,
  Share,
  CheckCircle,
  Lock,
  LinkOff
} from '@mui/icons-material';

const VerificationDisplay = ({ testResultId }) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateVerification = async () => {
      try {
        const data = await verificationService.generateVerification(testResultId);
        setVerificationData(data);
        setError(null);
      } catch (err) {
        setError(verificationService.formatError(err));
      } finally {
        setLoading(false);
      }
    };

    if (testResultId) {
      generateVerification();
    }
  }, [testResultId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationData?.verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationData?.verificationUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleRevokeAccess = async () => {
    try {
      await verificationService.revokeAccess(testResultId);
      setShowRevoked(true);
      setError(null);
    } catch (err) {
      setError(verificationService.formatError(err));
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        {error}
      </Alert>
    );
  }

  const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
  };

  return (
    <Paper 
      sx={{ 
        ...glassmorphismStyle,
        p: 4,
        maxWidth: 600,
        mx: 'auto',
        mt: 4
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Lock sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
          Share Your Results
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
          Provide one of the following to financial institutions to verify your test results
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Verification Code Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
          Verification Code
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'Inter, sans-serif' }}>
          Share this code with institutions to verify your results
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={verificationData?.verificationCode || ''}
            InputProps={{
              readOnly: true,
              sx: { 
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                letterSpacing: '0.1em'
              }
            }}
          />
          <Tooltip title={copied ? "Copied!" : "Copy code"}>
            <IconButton 
              onClick={handleCopyCode}
              color={copied ? "success" : "primary"}
            >
              {copied ? <CheckCircle /> : <ContentCopy />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Shareable Link Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
          Shareable Link
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'Inter, sans-serif' }}>
          Share this link for instant result verification
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={verificationData?.verificationUrl || ''}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'Inter, sans-serif' }
            }}
          />
          <Tooltip title={linkCopied ? "Copied!" : "Copy link"}>
            <IconButton 
              onClick={handleCopyLink}
              color={linkCopied ? "success" : "primary"}
            >
              {linkCopied ? <CheckCircle /> : <Share />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Security Controls */}
      <Box 
        sx={{ 
          mt: 4, 
          p: 3, 
          bgcolor: 'rgba(26, 35, 126, 0.05)', 
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            Access Control
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter, sans-serif' }}>
            {showRevoked 
              ? "Access has been revoked" 
              : "Revoke access to prevent future verifications"
            }
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color={showRevoked ? "error" : "primary"}
          startIcon={<LinkOff />}
          onClick={handleRevokeAccess}
          disabled={showRevoked}
        >
          {showRevoked ? "Access Revoked" : "Revoke Access"}
        </Button>
      </Box>

      {/* Help Text */}
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
        Need help? <Link href="/support" underline="hover">Contact our support team</Link>
      </Typography>

      <Snackbar
        open={copied || linkCopied}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {copied ? "Verification code copied!" : "Verification link copied!"}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default VerificationDisplay;
