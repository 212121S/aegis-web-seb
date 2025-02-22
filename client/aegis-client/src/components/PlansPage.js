import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const PlansPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (plan) => {
    console.log('Selecting plan:', { plan });
    navigate('/payment', { 
      state: { 
        selectedPlan: plan,
        timestamp: new Date().toISOString()
      },
      replace: true // Use replace to prevent back button issues
    });
  };

  if (user?.subscription?.active) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Active Subscription
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph align="center">
            You already have an active subscription. Start practicing now!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/practice')}
            >
              Go to Practice Tests
            </Button>
          </Box>
        </Box>
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
                  onClick={() => handleSelectPlan('officialTest')}
                  sx={{ mt: 2 }}
                >
                  Purchase Test
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
                  onClick={() => handleSelectPlan('basicSubscription')}
                  sx={{ mt: 2 }}
                >
                  Subscribe Now
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
                  onClick={() => handleSelectPlan('premiumSubscription')}
                  sx={{ mt: 2 }}
                >
                  Get Premium
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

export default PlansPage;
