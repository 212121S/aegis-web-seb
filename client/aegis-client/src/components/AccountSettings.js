import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  useTheme,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Person,
  Security,
  Notifications,
  Payment,
  PhotoCamera,
  Assessment,
  Link as LinkIcon
} from '@mui/icons-material';
import { authAPI, paymentAPI } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AccountSettings() {
  const theme = useTheme();
  const { user, error: authError, updateProfile: updateUserProfile } = useAuth();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: null,
    notifications: {
      email: true,
      testReminders: true,
      promotions: false
    }
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.username || user.name || '',
        email: user.email || '',
        subscription: user.subscription || null,
        verificationToken: user.verificationToken,
        testHistory: user.testHistory || [],
        highestScore: user.highestScore || 0,
        averageScore: user.averageScore || 0,
        notifications: {
          email: true,
          testReminders: true,
          promotions: false
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use the context's updateProfile function which handles token verification
      const success = await updateUserProfile({
        name: userData.name,
        email: userData.email,
        username: userData.name // Include both name and username for backward compatibility
      });

      if (success) {
        setSuccess('Profile updated successfully');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    // Password change logic
  };

  const handleNotificationChange = (setting) => (event) => {
    setUserData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [setting]: event.target.checked
      }
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Avatar upload logic
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      
      await paymentAPI.cancelSubscription();
      setSuccess('Subscription cancelled successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel subscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                textTransform: 'none'
              }
            }}
          >
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Payment />} label="Subscription" />
            <Tab icon={<Assessment />} label="Test History" />
          </Tabs>
        </Box>

        {(error || success) && (
          <Box sx={{ p: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        )}

        <TabPanel value={value} index={0}>
          <Box component="form" onSubmit={handleProfileUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar
                  src={userData.avatar}
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: theme.palette.primary.main
                  }}
                >
                  {userData.name?.charAt(0) || <Person />}
                </Avatar>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  sx={{ mb: 2 }}
                >
                  Change Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData({ ...userData, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={userData.email}
                  onChange={(e) =>
                    setUserData({ ...userData, email: e.target.value })
                  }
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Box component="form" onSubmit={handlePasswordChange}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  required
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                Update Password
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={userData.notifications.email}
                    onChange={handleNotificationChange('email')}
                  />
                }
                label="General email notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={userData.notifications.testReminders}
                    onChange={handleNotificationChange('testReminders')}
                  />
                }
                label="Test reminders"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={userData.notifications.promotions}
                    onChange={handleNotificationChange('promotions')}
                  />
                }
                label="Promotional emails"
              />
            </CardContent>
          </Card>
        </TabPanel>

          <TabPanel value={value} index={3}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Current Subscription
              </Typography>
              {loading ? (
                <CircularProgress size={24} />
              ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              ) : userData.subscription?.active ? (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" color="primary">
                          {(userData.subscription?.planId || 'Basic').charAt(0).toUpperCase() + 
                           (userData.subscription?.planId || 'Basic').slice(1)} Plan
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active until {new Date(userData.subscription?.currentPeriodEnd || Date.now()).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label="Active"
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      sx={{ mt: 1 }}
                    >
                      Cancel Subscription
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    You don't have an active subscription
                  </Alert>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/pricing"
                    sx={{ mt: 1 }}
                  >
                    View Plans
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Payment History
              </Typography>
              <Typography color="text.secondary" paragraph>
                View your payment history and download invoices
              </Typography>
              {/* Payment history will be implemented later */}
            </Box>
          </TabPanel>

          <TabPanel value={value} index={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Official Test History
              </Typography>
              
              {/* Verification Link */}
              <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Verification Link
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      onClick={() => {
                        if (userData.verificationToken) {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/verify/${userData.verificationToken}`
                          );
                          setSuccess('Verification link copied to clipboard');
                        }
                      }}
                      disabled={!userData.verificationToken}
                    >
                      Copy Link
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Share this link to verify your test scores
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const response = await authAPI.regenerateVerificationToken();
                        setUserData(prev => ({
                          ...prev,
                          verificationToken: response.data.verificationToken
                        }));
                        setSuccess('Verification link regenerated');
                      } catch (err) {
                        setError('Failed to regenerate verification link');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Regenerate Link
                  </Button>
                </CardContent>
              </Card>

              {/* Test Statistics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Highest Score
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {userData.highestScore || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Average Score
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {Math.round(userData.averageScore) || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tests Taken
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {userData.testHistory?.filter(test => test.type === 'official').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Test History List */}
              {userData.testHistory?.filter(test => test.type === 'official').map((test, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">
                          Score: {test.score}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(test.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.palette.primary.main,
                        color: 'white'
                      }}>
                        {test.score}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>
      </Paper>
    </Container>
  );
}

export default AccountSettings;
