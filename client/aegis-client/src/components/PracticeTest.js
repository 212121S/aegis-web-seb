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

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const results = await examAPI.submitPracticeTest({ answers: formattedAnswers });

      // Store results for the results page
      localStorage.setItem('lastTestResults', JSON.stringify(results));
      localStorage.removeItem('currentPracticeTest'); // Clear the test session

      navigate('/test-results');
    } catch (error) {
      console.error('Failed to submit test:', error);
      setError(error.message || 'Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
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

          {/* Question Tags */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {currentQuestion?.industryVerticals.map(vertical => (
              <Chip
                key={vertical}
                label={vertical}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            {currentQuestion?.topics.map(topic => (
              <Chip
                key={topic}
                label={topic}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ))}
            <Chip
              label={`Difficulty: ${currentQuestion?.difficulty}`}
              size="small"
              color="default"
              variant="outlined"
            />
          </Box>

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
                    Submitting...
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
