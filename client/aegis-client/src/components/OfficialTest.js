import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import { examAPI } from '../utils/axios';

const OfficialTest = () => {
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
  const [timeLeft, setTimeLeft] = useState(30);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    initializeTest();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (question) {
      // Clear any existing timer
      if (timer) clearInterval(timer);
      
      // Start new timer
      setTimeLeft(30);
      const newTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(newTimer);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimer(newTimer);

      // Cleanup on unmount or new question
      return () => clearInterval(newTimer);
    }
  }, [question]);

  const handleTimeout = async () => {
    if (!question) return;
    
    try {
      setLoading(true);
      const timeSpent = 30; // Full time used
      
      const response = await examAPI.submitAnswer(session, {
        questionId: question._id,
        answer: '', // Empty answer counts as incorrect
        timeSpent
      });

      setScore(response.currentScore);
      setIncorrectAnswers(response.incorrectAnswers);
      setStartTime(Date.now());
      
      if (response.incorrectAnswers >= 5) {
        await finalizeTest();
      } else {
        await fetchNextQuestion();
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error(err);
    }
  };

  const initializeTest = async () => {
    try {
      const response = await examAPI.initialize('official');
      if (!response.sessionId) {
        throw new Error('Invalid server response');
      }
      setSession(response.sessionId);
      setStartTime(Date.now());
      await fetchNextQuestion(response.sessionId);
    } catch (err) {
      setError('Failed to initialize test');
      console.error(err);
    }
  };

  const fetchNextQuestion = async (sessionId) => {
    try {
      setLoading(true);
      const response = await examAPI.getNextQuestion(sessionId || session);
      
      if (response.completed) {
        await finalizeTest();
        return;
      }

      setQuestion(response);
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
      
      const response = await examAPI.submitAnswer(session, {
        questionId: question._id,
        answer: selectedAnswer,
        timeSpent
      });

      setScore(response.currentScore);
      setIncorrectAnswers(response.incorrectAnswers);
      setStartTime(Date.now());
      
      if (response.incorrectAnswers >= 5) {
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
      const response = await examAPI.finalizeTest(session);
      
      navigate(`/test/results/${response._id}`);
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

      <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
        <Box sx={{ 
          position: 'absolute',
          top: 10,
          right: 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: timeLeft <= 5 ? 'error.main' : 'primary.main',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {timeLeft}
        </Box>
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

export default OfficialTest;
