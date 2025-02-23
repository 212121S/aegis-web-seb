import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  Divider,
  Stack,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const results = location.state?.results;
  const config = location.state?.config;

  if (!results || !config) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          No test results found. Please take a practice test first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/practice-builder')}
          sx={{ mt: 2 }}
        >
          Go to Test Builder
        </Button>
      </Container>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)'
        }
      }
    }
  };

  // Prepare chart data for topics
  const topicChartData = {
    labels: Object.keys(results.byTopic),
    datasets: [
      {
        data: Object.values(results.byTopic).map(t => t.percentage),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  // Prepare chart data for verticals
  const verticalChartData = {
    labels: Object.keys(results.byVertical),
    datasets: [
      {
        data: Object.values(results.byVertical).map(v => v.percentage),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  // Prepare chart data for roles
  const roleChartData = {
    labels: Object.keys(results.byRole),
    datasets: [
      {
        data: Object.values(results.byRole).map(r => r.percentage),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Overall Score */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Test Results
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Here's how you performed on your practice test:
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={results.overall.percentage}
                  size={120}
                  thickness={4}
                  sx={{ color: 'success.main' }}
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
                  <Typography variant="h4" component="div">
                    {Math.round(results.overall.percentage)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              {results.overall.correct} correct out of {results.overall.total} questions
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Test Configuration */}
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Test Configuration
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Verticals:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {config.verticals.map(vertical => (
                <Chip key={vertical} label={vertical} size="small" />
              ))}
            </Stack>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Roles:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {config.roles.map(role => (
                <Chip key={role} label={role} size="small" />
              ))}
            </Stack>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Topics:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {config.topics.map(topic => (
                <Chip key={topic} label={topic} size="small" />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Performance Charts */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Topic
            </Typography>
            <Bar data={topicChartData} options={chartOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Vertical
            </Typography>
            <Bar data={verticalChartData} options={chartOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Role
            </Typography>
            <Bar data={roleChartData} options={chartOptions} />
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Question Review */}
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Question Review
        </Typography>
        <List>
          {results.questions.map((question, index) => (
            <Accordion key={question.questionId}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Typography sx={{ flexGrow: 1 }}>
                    Question {index + 1}
                  </Typography>
                  <Chip
                    label={question.correct ? 'Correct' : 'Incorrect'}
                    color={question.correct ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Your Answer"
                      secondary={question.userAnswer}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Correct Answer"
                      secondary={question.correctAnswer}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Explanation"
                      secondary={question.explanation}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/practice-builder')}
        >
          Take Another Test
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default TestResults;
