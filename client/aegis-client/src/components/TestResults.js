import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  useTheme
} from '@mui/material';
import {
  Timeline,
  Assessment,
  TrendingUp,
  AccessTime,
  School
} from '@mui/icons-material';
import axios from '../utils/axios';

const TestResults = () => {
  const { testId } = useParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [testId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/exam/results/${testId}`);
      setResults(response.data);
    } catch (err) {
      setError('Failed to load test results');
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

  if (!results) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Overall Score */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Test Results
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <CircularProgress
                variant="determinate"
                value={results.finalScore}
                size={120}
                thickness={4}
                sx={{ color: theme.palette.success.main }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" component="div" color="text.secondary">
                  {results.finalScore}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="subtitle1" color="text.secondary">
              {results.type === 'practice' ? 'Practice Test' : 'Official Test'} •{' '}
              {new Date(results.completedAt).toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time Analysis
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Average Time per Question"
                    secondary={`${results.timePerQuestion.toFixed(1)} seconds`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Time"
                    secondary={`${results.totalTime} minutes`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Difficulty Progression
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Average Difficulty"
                    secondary={results.averageDifficulty.toFixed(1)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Highest Difficulty Reached"
                    secondary={results.maxDifficulty}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Performance
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Questions Attempted"
                    secondary={results.questionsAttempted}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Incorrect Answers"
                    secondary={results.incorrectAnswers}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Category
            </Typography>
            <Grid container spacing={2}>
              {results.questionBreakdown.map((category) => (
                <Grid item xs={12} key={category.category}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">
                        {category.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.correct}/{category.total} ({((category.correct/category.total) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(category.correct/category.total) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Percentile Ranking */}
        {results.percentile && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Percentile Ranking
              </Typography>
              <Typography variant="h3" color="primary">
                {results.percentile.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You performed better than {results.percentile.toFixed(1)}% of test takers
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Proctoring Events */}
        {results.proctoringEvents && results.proctoringEvents.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Proctoring Events
              </Typography>
              <List>
                {results.proctoringEvents.map((event, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={event.type}
                      secondary={new Date(event.timestamp).toLocaleTimeString()}
                    />
                    <Chip
                      label={event.type}
                      color="warning"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default TestResults;
