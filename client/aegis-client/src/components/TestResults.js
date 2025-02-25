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
  Divider,
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

  // Helper function to clean markdown formatting from text
  const cleanMarkdown = (text) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '');
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

  // Helper function to get status label based on percentage
  const getStatusLabel = (percentage) => {
    if (percentage >= 90) return 'Exceptional';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Adequate';
    if (percentage > 0) return 'Poor';
    return 'Not Addressed';
  };

  // Helper function to get color based on percentage
  const getStatusColor = (percentage) => {
    if (percentage >= 70) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
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
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
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
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Correct Answer:
                      </Typography>
                      <Typography paragraph>
                        {cleanMarkdown(question.correctAnswer)}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Explanation:
                      </Typography>
                      <Typography paragraph>
                        {question.explanation}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Holistic Feedback from ChatGPT */}
                  {question.holisticFeedback && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        AI Grading Assessment
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          borderLeft: '4px solid #3f51b5',
                          backgroundColor: 'rgba(63, 81, 181, 0.05)'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Overall Assessment
                          </Typography>
                          <Chip 
                            label={`${question.holisticFeedback.score}%`}
                            color={getStatusColor(question.holisticFeedback.score)}
                          />
                        </Box>
                        <Typography variant="body1">
                          {question.holisticFeedback.feedback}
                        </Typography>
                      </Paper>
                    </>
                  )}
                  
                  {/* Concept Feedback for Written Answers */}
                  {question.conceptsFeedback && question.conceptsFeedback.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Grading Breakdown
                      </Typography>
                      
                      {/* Compact Grading Table */}
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Concept</TableCell>
                              <TableCell align="center">Weight</TableCell>
                              <TableCell align="center">Score</TableCell>
                              <TableCell align="center">Points</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {question.conceptsFeedback.map((concept, idx) => (
                              <TableRow key={idx} sx={{ 
                                backgroundColor: concept.qualityPercentage > 0
                                  ? `rgba(76, 175, 80, ${Math.min(concept.qualityPercentage / 100, 0.2)})`
                                  : 'rgba(244, 67, 54, 0.1)'
                              }}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {concept.concept}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {concept.description || 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">{concept.weight}%</TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Chip 
                                      label={`${concept.qualityPercentage}%`}
                                      color={getStatusColor(concept.qualityPercentage)}
                                      size="small"
                                      sx={{ fontWeight: 'bold' }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {getStatusLabel(concept.qualityPercentage)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  {((concept.qualityPercentage / 100) * concept.weight).toFixed(1)} / {concept.weight}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Total row */}
                            <TableRow sx={{ backgroundColor: 'rgba(63, 81, 181, 0.1)' }}>
                              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={`${question.score ? question.score.toFixed(1) : 0}%`}
                                  color={getStatusColor(question.score || 0)}
                                  size="small"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {question.conceptsFeedback.reduce((total, concept) => 
                                  total + ((concept.qualityPercentage / 100) * concept.weight), 0).toFixed(1)} / 100
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      {/* Detailed Feedback - Collapsible */}
                      <Typography variant="h6" gutterBottom>
                        Detailed Feedback
                      </Typography>
                      <Grid container spacing={2}>
                        {question.conceptsFeedback.map((concept, idx) => (
                          <Grid item xs={12} md={6} key={idx}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                height: '100%',
                                borderLeft: `4px solid ${
                                  concept.qualityPercentage >= 70 ? '#4caf50' : 
                                  concept.qualityPercentage >= 50 ? '#ff9800' : '#f44336'
                                }`
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {concept.concept}
                                </Typography>
                                <Chip 
                                  label={`${concept.qualityPercentage}%`}
                                  color={getStatusColor(concept.qualityPercentage)}
                                  size="small"
                                />
                              </Box>
                              
                              {/* Only show if feedback is meaningful */}
                              {concept.feedback && 
                               !concept.feedback.includes("not evaluated") && 
                               !concept.feedback.includes("does not appear to address this concept adequately") && (
                                <Typography variant="body2">
                                  {concept.feedback}
                                </Typography>
                              )}
                              
                              {/* Show a default message if no meaningful feedback */}
                              {(!concept.feedback || 
                                concept.feedback.includes("not evaluated") || 
                                concept.feedback.includes("does not appear to address this concept adequately")) && (
                                <Typography variant="body2" color="text.secondary">
                                  {concept.addressed 
                                    ? "This concept is partially addressed in your answer."
                                    : "This concept was not clearly addressed in your answer."}
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
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
