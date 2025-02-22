import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { examAPI } from '../utils/axios';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  LinearProgress
} from '@mui/material';

const PracticeTest = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching practice questions...');
      const response = await examAPI.getPracticeQuestions();
      console.log('Practice questions response:', response.data);
      setQuestions(response.data);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load practice questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: value
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await examAPI.submitPracticeTest({
        answers: Object.entries(answers).map(([index, answer]) => ({
          questionId: questions[parseInt(index)]._id,
          answer
        }))
      });

      navigate('/dashboard', { state: { testResults: response.data } });
    } catch (err) {
      console.error('Failed to submit test:', err);
      setError('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadQuestions}>
          Try Again
        </Button>
      </Container>
    );
  }

  if (!questions.length) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="info">
          No practice questions available at this time.
        </Alert>
      </Container>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box mb={2}>
          <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Question {currentIndex + 1} of {questions.length}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          {currentQuestion.text}
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%', my: 2 }}>
          <RadioGroup
            value={answers[currentIndex] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
          >
            {currentQuestion.options.map((option, idx) => (
              <FormControlLabel
                key={idx}
                value={option}
                control={<Radio />}
                label={option}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          
          {currentIndex === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length !== questions.length}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!answers[currentIndex]}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PracticeTest;
