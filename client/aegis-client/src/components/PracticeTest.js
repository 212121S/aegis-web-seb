import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../utils/axios';

const PracticeTest = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testSession, setTestSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryMessage, setRetryMessage] = useState('');
  const MAX_RETRIES = 3;

  useEffect(() => {
    loadTestSession();
  }, []);

  const loadTestSession = () => {
    try {
      const savedSession = localStorage.getItem('currentPracticeTest');
      if (!savedSession) {
        navigate('/practice-builder');
        return;
      }

      const session = JSON.parse(savedSession);
      setTestSession(session);
      
      // Initialize answers object
      const initialAnswers = {};
      session.questions.forEach(q => {
        initialAnswers[q.questionId] = '';
      });
      setAnswers(initialAnswers);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load test session:', error);
      setError('Failed to load test session. Please try again.');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Helper function to delay execution with exponential backoff
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const submitTestWithRetry = async (formattedAnswers, currentRetry = 0) => {
    try {
      // Update retry UI
      setRetryCount(currentRetry);
      
      if (currentRetry > 0) {
        setRetryMessage(`Attempt ${currentRetry}/${MAX_RETRIES} - Retrying submission...`);
      }
      
      // Attempt to submit the test
      const results = await examAPI.submitPracticeTest({ answers: formattedAnswers });
      
      // Success - store results and navigate
      localStorage.setItem('lastTestResults', JSON.stringify(results));
      localStorage.removeItem('currentPracticeTest'); // Clear the test session
      navigate('/test-results');
      
      return true;
    } catch (error) {
      console.error(`Submission attempt ${currentRetry + 1} failed:`, error);
      
      // If we haven't reached max retries, try again with exponential backoff
      if (currentRetry < MAX_RETRIES - 1) {
        const backoffTime = Math.pow(2, currentRetry) * 1000; // Exponential backoff: 1s, 2s, 4s, etc.
        setRetryMessage(`Submission attempt ${currentRetry + 1} failed. Retrying in ${backoffTime/1000} seconds...`);
        
        // Wait with backoff before retrying
        await delay(backoffTime);
        
        // Recursive retry with incremented counter
        return submitTestWithRetry(formattedAnswers, currentRetry + 1);
      } else {
        // Max retries reached, throw the error to be caught by the caller
        throw error;
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setRetryCount(0);
      setRetryMessage('');

      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      // Call the retry function
      await submitTestWithRetry(formattedAnswers);
      
    } catch (error) {
      console.error('All submission retry attempts failed:', error);
      setError(error.message || 'Failed to submit test after multiple attempts. Please try again.');
    } finally {
      setSubmitting(false);
      setRetryMessage('');
    }
  };

  const currentQuestion = testSession?.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (testSession?.questions.length || 1)) * 100;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Paper sx={{ p: 3 }}>
          {/* Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Question {currentQuestionIndex + 1} of {testSession?.questions.length}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Question Text */}
          <Typography variant="h6" gutterBottom>
            {currentQuestion?.text}
          </Typography>

          {/* Answer Input */}
          <Box sx={{ my: 3 }}>
            {currentQuestion?.type === 'multiple_choice' ? (
              <RadioGroup
                value={answers[currentQuestion.questionId] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            ) : (
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Type your answer here..."
                value={answers[currentQuestion.questionId] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
              />
            )}
          </Box>

          {/* Retry Message */}
          {submitting && retryCount > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {retryMessage}
            </Alert>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            {currentQuestionIndex < testSession.questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                disabled={!answers[currentQuestion.questionId]}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting || !Object.values(answers).every(a => a)}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                    {retryCount === 0 ? 'Submitting...' : `Retry ${retryCount}/${MAX_RETRIES} in progress...`}
                  </>
                ) : (
                  'Submit Test'
                )}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PracticeTest;
