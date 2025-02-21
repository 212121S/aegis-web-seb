import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  LinearProgress,
  Paper,
} from '@mui/material';
import axios from '../utils/axios';

const TestEnvironment = () => {
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('Failed to initialize test:', error);
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
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
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
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setLoading(false);
    }
  };

  const finalizeTest = async () => {
    try {
      const response = await axios.post(`/api/exam/${session}/finalize`);
      // Navigate to results page or show final score
      console.log('Test completed:', response.data);
    } catch (error) {
      console.error('Failed to finalize test:', error);
    }
  };

  if (loading && !question) {
    return (
      <Container maxWidth="md">
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Score: {score.toFixed(2)}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Incorrect Answers: {incorrectAnswers}/5
          </Typography>
        </Paper>

        {question && (
          <Card>
            <CardContent>
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
                  />
                ))}
              </RadioGroup>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAnswerSubmit}
                  disabled={!selectedAnswer}
                >
                  Submit Answer
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default TestEnvironment;
