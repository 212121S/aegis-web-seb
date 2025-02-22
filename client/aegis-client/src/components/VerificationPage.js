import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import axios from '../utils/axios';

const VerificationPage = () => {
  const { token } = useParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`/api/auth/verification/${token}`);
      setUserData(response.data.user);
    } catch (err) {
      setError('Failed to verify user data');
      console.error(err);
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

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!userData) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {/* User Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            User Verification
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Name" secondary={userData.username} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email" secondary={userData.email} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Phone" secondary={userData.phone} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Performance
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Highest Score" 
                        secondary={userData.highestScore} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Average Score" 
                        secondary={Math.round(userData.averageScore)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Tests Taken" 
                        secondary={userData.testHistory.length} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Test History */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Official Test History
          </Typography>
          <Grid container spacing={2}>
            {userData.testHistory.map((test, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
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
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerificationPage;
