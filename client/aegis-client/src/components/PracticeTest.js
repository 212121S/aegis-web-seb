import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import axios from '../utils/axios';

const PracticeTest = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    try {
      const response = await axios.post('/api/exam/initialize', {
        type: 'practice',
        browserInfo: {
          name: navigator.userAgent,
          version: navigator.appVersion,
          os: navigator.platform
        }
      });
      
      setSession(response.data.sessionId);
      setStartTime(Date.now());
      await fetchNextQuestion(response.data.sessionId);
    } catch (err) {
      setError('Failed to initialize test');
      console.error(err);
    }
  };

  const fetchNextQuestion = async (sessionId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/exam/${sessionId || session}/next-question`);
      
      if (response.data.completed) {
        await finalizeTest();
        return;
      }

      setQuestion(response.data);
      setSelectedAnswer('');
    } catch (err) {
      setError('Failed to fetch question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    try {
      setLoading(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      const response = await axios.post(`/api/exam/${session}/submit`, {
        questionId: question._id,
        answer: selectedAnswer,
        timeSpent
      });

      setScore(response.data.currentScore);
      setIncorrectAnswers(response.data.incorrectAnswers);
      setStartTime(Date.now());
      
      if (response.data.incorrectAnswers >= 5) {
        await finalizeTest();
      } else {
        await fetchNextQuestion();
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error(err);
    }
  };

  const finalizeTest = async () => {
    try {
      const response = await axios.post(`/api/exam/${session}/finalize`);
      navigate(`/test/results/${response.data._id}`);
    } catch (err) {
      setError('Failed to finalize test');
      console.error(err);
    }
  };

  if (loading && !question) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Score: {score.toFixed(2)}%
          </Typography>
          <Typography variant="h6" color="error">
            Incorrect: {incorrectAnswers}/5
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(incorrectAnswers / 5) * 100}
          sx={{ 
            height: 8, 
            borderRadius: 4,
            mb: 3,
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.error.main
            }
          }}
        />
      </Paper>

      {question && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {question.prompt}
          </Typography>

          <RadioGroup
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
          >
            {question.choices.map((choice, index) => (
              <FormControlLabel
                key={index}
                value={choice}
                control={<Radio />}
                label={choice}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Difficulty: {question.difficulty}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default PracticeTest;
