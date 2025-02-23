import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  LinearProgress,
  TextField,
  Chip,
  Stack,
  Divider
} from '@mui/material';

const PracticeTest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const testSession = location.state?.testSession;
  const testConfig = location.state?.config;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!testSession || !testSession.questions) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          No test session found. Please return to the test builder to create a new test.
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

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: value
    }));
  };

  const handleNext = () => {
    if (currentIndex < testSession.questions.length - 1) {
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

      const response = await examAPI.post('/practice/submit', {
        answers: Object.entries(answers).map(([index, answer]) => ({
          questionId: testSession.questions[parseInt(index)].questionId,
          answer
        }))
      });

      navigate('/test-results', { 
        state: { 
          results: response.data,
          config: testConfig
        }
      });
    } catch (err) {
      console.error('Failed to submit test:', err);
      setError('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const currentQuestion = testSession.questions[currentIndex];
  const progress = (Object.keys(answers).length / testSession.questions.length) * 100;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* Test Configuration Summary */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Verticals:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {testConfig.verticals.map(vertical => (
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
              {testConfig.roles.map(role => (
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
              {testConfig.topics.map(topic => (
                <Chip key={topic} label={topic} size="small" />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Question Display */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box mb={2}>
          <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Question {currentIndex + 1} of {testSession.questions.length}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          {currentQuestion.text}
        </Typography>

        {currentQuestion.type === 'multiple_choice' ? (
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
        ) : (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answers[currentIndex] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer here..."
            sx={{ my: 2 }}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          
          {currentIndex === testSession.questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length !== testSession.questions.length}
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
