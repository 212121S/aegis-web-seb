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
  Chip,
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
                    {question.score !== undefined 
                      ? `${question.score.toFixed(1)}%`
                      : question.correct ? 'Correct' : 'Incorrect'}
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
                  <Typography paragraph>
                    {question.explanation}
                  </Typography>
                  
                  {/* Concept Feedback for Written Answers */}
                  {question.conceptsFeedback && question.conceptsFeedback.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                        Grading Breakdown:
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Concept</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell align="center">Weight</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {question.conceptsFeedback.map((concept, idx) => (
                              <TableRow key={idx} sx={{ 
                                backgroundColor: concept.qualityPercentage > 0
                                  ? `rgba(76, 175, 80, ${Math.min(concept.qualityPercentage / 100, 0.2)})`
                                  : 'rgba(244, 67, 54, 0.1)'
                              }}>
                                <TableCell>{concept.concept}</TableCell>
                                <TableCell>{concept.description || 'N/A'}</TableCell>
                                <TableCell align="center">{concept.weight}%</TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography sx={{ 
                                      color: concept.qualityPercentage >= 70 ? 'success.main' : 
                                             concept.qualityPercentage >= 50 ? 'warning.main' : 'error.main',
                                      fontWeight: 'bold'
                                    }}>
                                      {concept.qualityPercentage}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {concept.qualityPercentage >= 90 ? 'Exceptional' :
                                       concept.qualityPercentage >= 70 ? 'Good' :
                                       concept.qualityPercentage >= 50 ? 'Adequate' :
                                       concept.qualityPercentage > 0 ? 'Poor' : 'Not Addressed'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      {/* Detailed Feedback */}
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Detailed Feedback:
                      </Typography>
                      {question.conceptsFeedback.map((concept, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1, borderLeft: concept.addressed ? '4px solid #4caf50' : '4px solid #f44336' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {concept.concept} ({concept.weight}%)
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ 
                                fontWeight: 'bold',
                                color: concept.qualityPercentage >= 70 ? 'success.main' : 
                                       concept.qualityPercentage >= 50 ? 'warning.main' : 'error.main',
                              }}>
                                {concept.qualityPercentage}%
                              </Typography>
                              <Chip 
                                label={
                                  concept.qualityPercentage >= 90 ? 'Exceptional' :
                                  concept.qualityPercentage >= 70 ? 'Good' :
                                  concept.qualityPercentage >= 50 ? 'Adequate' :
                                  concept.qualityPercentage > 0 ? 'Poor' : 'Not Addressed'
                                } 
                                color={
                                  concept.qualityPercentage >= 70 ? 'success' :
                                  concept.qualityPercentage >= 50 ? 'warning' : 'error'
                                }
                                size="small"
                              />
                            </Box>
                          </Box>
                          
                          {/* Calculate points earned for this concept */}
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Points: {((concept.qualityPercentage / 100) * concept.weight).toFixed(1)} / {concept.weight}
                          </Typography>
                          
                          {/* Only show if feedback isn't the default "not evaluated" message */}
                          {concept.feedback && !concept.feedback.includes("not evaluated") && (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                                Feedback:
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {concept.feedback}
                              </Typography>
                            </>
                          )}
                        </Paper>
                      ))}
                    </>
                  )}
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
