import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme
} from '@mui/material';
import {
  Timeline,
  Assessment,
  School,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { examAPI } from '../utils/axios';
import { useSubscription } from '../hooks/useSubscription';

const UserDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const { subscription, isSubscriptionActive } = useSubscription();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get test history
      const history = await examAPI.getHistory();
      const testHistory = Array.isArray(history) ? history : [];
      setTestHistory(testHistory);

      // Calculate analytics from history
      if (testHistory.length > 0) {
        const analytics = {
          testsCompleted: history.length,
          averageScore: history.reduce((sum, test) => sum + test.score, 0) / history.length,
          highestScore: Math.max(...history.map(test => test.score))
        };
        setAnalytics(analytics);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user data. Please try again.');
      setTestHistory([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Subscription Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Subscription Status
            </Typography>
            {isSubscriptionActive() ? (
              <Alert severity="success">
                Your {subscription?.plan} subscription is active until{' '}
                {new Date(subscription?.expiresAt).toLocaleDateString()}
              </Alert>
            ) : (
              <Alert severity="warning">
                No active subscription. <Link to="/plans">View plans</Link>
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Practice Test
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Take a practice test to prepare for the official exam
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    component={Link}
                    to="/test/practice"
                    variant="contained"
                    color="primary"
                    disabled={!isSubscriptionActive()}
                  >
                    Start Practice Test
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Official Test
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Take the official proctored examination
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    component={Link}
                    to="/test/official"
                    variant="contained"
                    color="secondary"
                  >
                    Start Official Test
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Analytics Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Performance Analytics
            </Typography>
            {analytics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {analytics.averageScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Score
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {analytics.testsCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tests Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {analytics.highestScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Highest Score
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">
                Complete a test to see your analytics
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {testHistory.slice(0, 5).map((test, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {test.type === 'practice' ? 'Practice Test' : 'Official Test'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Score: {test.score}% • {new Date(test.completedAt).toLocaleDateString()}
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Test History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Test History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Time Spent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testHistory.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        {new Date(test.completedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.type === 'practice' ? 'Practice' : 'Official'}
                          color={test.type === 'practice' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{test.score}%</TableCell>
                      <TableCell>{test.timeSpent} minutes</TableCell>
                      <TableCell>
                        <Chip
                          label={test.status}
                          color={test.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          to={`/test/results/${test.id}`}
                          size="small"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;
