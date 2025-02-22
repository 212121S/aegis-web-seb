import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import config from '../config';
import { paymentAPI } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripeError, setStripeError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { state: { from: '/payment' } });
      return;
    }

    // Check if Stripe is configured
    if (!config.stripe.publicKey || !config.stripe.prices.officialTest || 
        !config.stripe.prices.basicSubscription || !config.stripe.prices.premiumSubscription) {
      setStripeError('Payment system is not properly configured. Please try again later.');
      console.error('Stripe configuration missing:', {
        publicKey: !config.stripe.publicKey ? 'missing' : 'configured',
        officialTest: !config.stripe.prices.officialTest ? 'missing' : 'configured',
        basicSubscription: !config.stripe.prices.basicSubscription ? 'missing' : 'configured',
        premiumSubscription: !config.stripe.prices.premiumSubscription ? 'missing' : 'configured'
      });
    }
  }, [user, navigate]);

  // Handle plan selection from location state
  useEffect(() => {
    if (!location.state?.selectedPlan) {
      console.log('No plan selected, redirecting to plans page');
      navigate('/plans');
      return;
    }

    console.log('Plan selected:', {
      plan: location.state.selectedPlan,
      timestamp: location.state.timestamp
    });

    handlePurchase(location.state.selectedPlan);
  }, [location, navigate]);

  const handlePurchase = async (productType, fromButton = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!config.stripe.publicKey) {
        throw new Error('Payment system is not fully configured');
      }

      const stripe = await loadStripe(config.stripe.publicKey);
      if (!stripe) {
        throw new Error('Failed to initialize payment system');
      }

      // Get and validate price ID based on product type
      let priceId;
      const priceIdMap = {
        officialTest: {
          configKey: 'officialTest',
          envKey: 'REACT_APP_STRIPE_OFFICIAL_TEST_PRICE_ID',
          displayName: 'Official Test'
        },
        basicSubscription: {
          configKey: 'basicSubscription',
          envKey: 'REACT_APP_STRIPE_BASIC_SUBSCRIPTION_PRICE_ID',
          displayName: 'Basic Subscription'
        },
        premiumSubscription: {
          configKey: 'premiumSubscription',
          envKey: 'REACT_APP_STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID',
          displayName: 'Premium Subscription'
        }
      };

      const productConfig = priceIdMap[productType];
      if (!productConfig) {
        console.error('Invalid product type:', { productType });
        throw new Error('Invalid product type');
      }

      priceId = config.stripe.prices[productConfig.configKey];
      const expectedPriceId = process.env[productConfig.envKey];

      // Debug logging
      console.log('Price ID validation:', {
        productType,
        configuredId: priceId,
        expectedId: expectedPriceId,
        matches: priceId === expectedPriceId,
        timestamp: new Date().toISOString()
      });

      if (priceId !== expectedPriceId) {
        console.error('Price ID mismatch:', {
          productType,
          configuredId: priceId,
          expectedId: expectedPriceId,
          productConfig
        });
        throw new Error(`Invalid price ID for ${productConfig.displayName}`);
      }

      // Log selection for debugging
      console.log('Selected plan:', {
        productType,
        priceId,
        fromButton,
        timestamp: new Date().toISOString(),
        availablePrices: {
          officialTest: config.stripe.prices.officialTest,
          basicSubscription: config.stripe.prices.basicSubscription,
          premiumSubscription: config.stripe.prices.premiumSubscription
        }
      });

      // Double check price ID is set
      if (!priceId) {
        console.error('Price ID not found:', {
          productType,
          officialTest: config.stripe.prices.officialTest ? 'configured' : 'not configured',
          basicSubscription: config.stripe.prices.basicSubscription ? 'configured' : 'not configured',
          premiumSubscription: config.stripe.prices.premiumSubscription ? 'configured' : 'not configured'
        });
        throw new Error(`Price ID not found for ${productType}. Please check configuration.`);
      }

      // Create checkout session
      const response = await paymentAPI.createSession(priceId);
      const { sessionId } = response;

      console.log('Checkout session created:', {
        sessionId,
        productType,
        priceId,
        timestamp: new Date().toISOString()
      });

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

  if (user?.subscription?.active) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          You already have an active subscription!
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Current Subscription
            </Typography>
            <Typography variant="body1" paragraph>
              You have access to all premium features.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/practice')}
            >
              Start Practice Tests
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Choose Your Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Select the option that best fits your needs
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

      <Grid container spacing={3} justifyContent="center">
        {/* Official Test Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Official Test
                </Typography>
                <Typography variant="h4" component="p" gutterBottom color="primary">
                  $4.99
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  One-time purchase
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Single official test attempt" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Proctoring included" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Official certification" />
                  </ListItem>
                </List>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => handlePurchase('officialTest', true)}
                  disabled={loading || stripeError}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Purchase Test'
                  )}
                </Button>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* Basic Subscription Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Basic Subscription
                </Typography>
                <Typography variant="h4" component="p" gutterBottom color="primary">
                  $19.99
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  per month
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Unlimited practice tests" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Basic analytics" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Study materials" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Email support" />
                  </ListItem>
                </List>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => handlePurchase('basicSubscription', true)}
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
          </Paper>
        </Grid>

        {/* Premium Subscription Card */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={4} 
            sx={{ 
              height: '100%',
              position: 'relative',
              '&::before': {
                content: '"RECOMMENDED"',
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'primary.main',
                color: 'white',
                padding: '4px 12px',
                borderBottomLeftRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Premium Subscription
                </Typography>
                <Typography variant="h4" component="p" gutterBottom color="primary">
                  $39.99
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  per month
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Everything in Basic" 
                      secondary="Unlimited practice tests, analytics, and study materials"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Priority support" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Advanced analytics" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Additional study materials" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="1 free official test per month" />
                  </ListItem>
                </List>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => handlePurchase('premiumSubscription', true)}
                  disabled={loading || stripeError}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Get Premium'
                  )}
                </Button>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Secure payments powered by Stripe
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Cancel subscription anytime • No hidden fees
        </Typography>
      </Box>
    </Container>
  );
};

export default PaymentPage;
