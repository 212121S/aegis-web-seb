import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Fade,
  Divider,
  TextField
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '../hooks/useSubscription';
import {
  CheckCircle,
  Star,
  Timer,
  School,
  TrendingUp
} from '@mui/icons-material';
import axios, { paymentAPI } from '../utils/axios';

import config from '../config';

// Initialize Stripe
const stripePromise = loadStripe(config.stripe.publicKey);

const practiceTestPlans = [
  {
    id: 'practice-basic',
    name: 'Basic Practice',
    price: 29.99,
    interval: 'month',
    features: [
      'Access to all practice tests',
      'Basic performance analytics',
      'Email support'
    ],
    recommended: false,
    color: 'primary',
    type: 'practice'
  },
  {
    id: 'practice-pro',
    name: 'Pro Practice',
    price: 49.99,
    interval: 'month',
    features: [
      'Everything in Basic Practice',
      'Advanced analytics',
      'Personalized study plan',
      'Priority support',
      'Live chat assistance'
    ],
    recommended: true,
    color: 'secondary',
    type: 'practice'
  }
];

const realTestPlans = [
  {
    id: 'test-standard',
    name: 'Standard Test',
    price: 99.99,
    interval: 'one-time',
    features: [
      'One official test attempt',
      'Basic proctoring',
      'Score report',
      'Email support'
    ],
    recommended: false,
    color: 'primary',
    type: 'real'
  },
  {
    id: 'test-premium',
    name: 'Premium Test',
    price: 149.99,
    interval: 'one-time',
    features: [
      'One official test attempt',
      'Advanced proctoring',
      'Detailed score analysis',
      'Priority support',
      'Score improvement guarantee'
    ],
    recommended: true,
    color: 'secondary',
    type: 'real'
  }
];

function PaymentPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const location = useLocation();
  const { subscription, isSubscriptionActive } = useSubscription();

  useEffect(() => {
    // Show message if redirected from a subscription-required feature
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location.state]);

  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const validateCoupon = async () => {
    if (!couponCode) return;
    
    setValidatingCoupon(true);
    setCouponError('');
    
    try {
      const response = await paymentAPI.validateCoupon(couponCode);
      setAppliedCoupon(response.data);
      setSuccess('Coupon applied successfully!');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setLoading(true);
    setError('');
    
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      if (!localStorage.getItem('token')) throw new Error('Please log in to subscribe');

      // Create a checkout session with coupon if applied
      const response = await paymentAPI.createCheckoutSession(planId, appliedCoupon?.code);

      // Redirect to Stripe Checkout URL
      window.location.href = response.data.url;
    } catch (err) {
      setError(err.message || 'Failed to process payment');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPlanCard = (plan) => (
    <Card
      elevation={plan.recommended ? 8 : 2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)'
        },
        border: plan.recommended
          ? `2px solid ${theme.palette.secondary.main}`
          : 'none'
      }}
    >
      {plan.recommended && (
        <Chip
          label="Recommended"
          color="secondary"
          icon={<Star />}
          sx={{
            position: 'absolute',
            top: -12,
            right: 20,
            zIndex: 1
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ color: theme.palette[plan.color].main }}
        >
          {plan.name}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" component="span">
            ${plan.price}
          </Typography>
          <Typography
            variant="subtitle1"
            component="span"
            color="text.secondary"
          >
            /{plan.interval}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        {plan.features.map((feature, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              color: 'text.secondary'
            }}
          >
            <CheckCircle
              sx={{ mr: 1, fontSize: 20, color: theme.palette.success.main }}
            />
            <Typography variant="body2">{feature}</Typography>
          </Box>
        ))}
      </CardContent>
      <CardActions sx={{ p: 3, pt: 0 }}>
        <Button
          fullWidth
          variant={plan.recommended ? 'contained' : 'outlined'}
          color={plan.color}
          size="large"
          onClick={() => handleSubscribe(plan.id)}
          disabled={loading || (plan.type === 'practice' && isSubscriptionActive())}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontSize: '1.1rem'
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            plan.type === 'practice' ? 'Subscribe Now' : 'Purchase Test'
          )}
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                Choose Your Prep Plan
              </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              Invest in your future with our comprehensive test preparation packages
            </Typography>
            {isSubscriptionActive() && (
              <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
                You currently have an active {subscription?.plan} subscription.
                Visit your <Link to="/account">account settings</Link> to manage your subscription.
              </Alert>
            )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" gutterBottom align="center">
                Practice Tests
              </Typography>
              <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
                Prepare for success with our comprehensive practice test packages
              </Typography>
              <Grid container spacing={4} justifyContent="center">
                {practiceTestPlans.map((plan) => (
                  <Grid item xs={12} md={6} key={plan.id}>
                    {renderPlanCard(plan)}
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 8 }} />

            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" gutterBottom align="center">
                Official Tests
              </Typography>
              <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
                Take the official test with our secure proctoring system
              </Typography>
              <Grid container spacing={4} justifyContent="center">
                {realTestPlans.map((plan) => (
                  <Grid item xs={12} md={6} key={plan.id}>
                    {renderPlanCard(plan)}
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ mt: 4, mb: 8, maxWidth: 400, mx: 'auto' }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Have a Coupon?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      error={!!couponError}
                      helperText={couponError}
                      disabled={loading || validatingCoupon}
                    />
                    <Button
                      variant="outlined"
                      onClick={validateCoupon}
                      disabled={!couponCode || loading || validatingCoupon}
                    >
                      {validatingCoupon ? <CircularProgress size={24} /> : 'Apply'}
                    </Button>
                  </Box>
                  {appliedCoupon && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Coupon applied: {appliedCoupon.description}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mt: 8, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>
                Why Choose Our Test Prep?
              </Typography>
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Timer sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Efficient Preparation
                    </Typography>
                    <Typography color="text.secondary">
                      Structured study plans to maximize your time
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Expert Guidance
                    </Typography>
                    <Typography color="text.secondary">
                      Learn from experienced instructors
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TrendingUp
                      sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                    />
                    <Typography variant="h6" gutterBottom>
                      Track Progress
                    </Typography>
                    <Typography color="text.secondary">
                      Detailed analytics and performance insights
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckCircle
                      sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                    />
                    <Typography variant="h6" gutterBottom>
                      Guaranteed Results
                    </Typography>
                    <Typography color="text.secondary">
                      Score improvement or money back
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default PaymentPage;
