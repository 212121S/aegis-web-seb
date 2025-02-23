import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions
} from '@mui/material';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleViewPlans = () => {
    navigate('/plans');
  };

  const handleStartPractice = () => {
    if (user) {
      navigate('/practice-test-builder');
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Welcome to Aegis Testing
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Prepare for your exams with our comprehensive practice tests and study materials.
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleStartPractice}
          >
            Practice Test Builder
          </Button>
          {!user?.subscription?.active && (
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleViewPlans}
            >
              View Plans
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Practice Tests
              </Typography>
              <Typography variant="body1" paragraph>
                Access our extensive library of practice questions and prepare at your own pace.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={handleStartPractice}>Learn More</Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Performance Analytics
              </Typography>
              <Typography variant="body1" paragraph>
                Track your progress and identify areas for improvement with detailed analytics.
              </Typography>
            </CardContent>
            <CardActions>
              {user ? (
                <Button size="small" onClick={() => navigate('/dashboard')}>View Dashboard</Button>
              ) : (
                <Button size="small" onClick={() => navigate('/login')}>Sign In</Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Premium Features
              </Typography>
              <Typography variant="body1" paragraph>
                Get access to official practice exams, study guides, and more with our premium plan.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={handleViewPlans}>View Plans</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
