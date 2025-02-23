import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TestResults = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = () => {
    try {
      const savedResults = localStorage.getItem('lastTestResults');
      if (!savedResults) {
        navigate('/practice-builder');
        return;
      }

      setResults(JSON.parse(savedResults));
    } catch (error) {
      console.error('Failed to load test results:', error);
      setError('Failed to load test results. Please try again.');
    }
  };

  const getChartData = (data, label) => ({
    labels: Object.keys(data),
    datasets: [
      {
        label,
        data: Object.values(data).map(item => item.percentage),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1
      }
    ]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  if (!results) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Overall Score */}
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Test Results
          </Typography>
          <Typography variant="h2" color="primary">
            {results.overall.percentage.toFixed(1)}%
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {results.overall.correct} correct out of {results.overall.total} questions
          </Typography>
        </Paper>

        {/* Performance by Topic */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Performance by Topic
          </Typography>
          <Box sx={{ height: 300, mb: 3 }}>
            <Bar
              data={getChartData(results.byTopic, 'Score by Topic')}
              options={chartOptions}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Topic</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Questions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(results.byTopic).map(([topic, data]) => (
                  <TableRow key={topic}>
                    <TableCell>{topic}</TableCell>
                    <TableCell align="right">{data.percentage.toFixed(1)}%</TableCell>
                    <TableCell align="right">{data.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Performance by Industry Vertical */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Performance by Industry Vertical
          </Typography>
          <Box sx={{ height: 300, mb: 3 }}>
            <Bar
              data={getChartData(results.byVertical, 'Score by Vertical')}
              options={chartOptions}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Industry Vertical</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Questions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(results.byVertical).map(([vertical, data]) => (
                  <TableRow key={vertical}>
                    <TableCell>{vertical}</TableCell>
                    <TableCell align="right">{data.percentage.toFixed(1)}%</TableCell>
                    <TableCell align="right">{data.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Detailed Question Review */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Question Review
          </Typography>
          {results.questions.map((question, index) => (
            <Accordion key={question.questionId}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flexGrow: 1 }}>
                    Question {index + 1}
                  </Typography>
                  <Typography
                    sx={{
                      color: question.correct ? 'success.main' : 'error.main',
                      fontWeight: 'bold',
                      mr: 2
                    }}
                  >
                    {question.correct ? 'Correct' : 'Incorrect'}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Question:
                  </Typography>
                  <Typography paragraph>
                    {question.questionText}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Your Answer:
                  </Typography>
                  <Typography paragraph>
                    {question.userAnswer}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Correct Answer:
                  </Typography>
                  <Typography paragraph>
                    {question.correctAnswer}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Explanation:
                  </Typography>
                  <Typography>
                    {question.explanation}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
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
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TestResults;
