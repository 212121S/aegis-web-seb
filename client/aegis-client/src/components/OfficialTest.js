import React, { useState, useEffect, useRef } from 'react';
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
import axios from '../utils/axios';

const OfficialTest = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [proctoringEnabled, setProctoringEnabled] = useState(false);

  useEffect(() => {
    if (proctoringEnabled) {
      initializeTest();
    }
  }, [proctoringEnabled]);

  const initializeProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setProctoringEnabled(true);
      setShowStartDialog(false);
    } catch (err) {
      setError('Failed to initialize proctoring. Camera and microphone access are required for the official test.');
      console.error(err);
    }
  };

  const initializeTest = async () => {
    try {
      const response = await axios.post('/api/exam/initialize', {
        type: 'official',
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
      
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Dialog open={showStartDialog} onClose={() => {}}>
        <DialogTitle>Official Test Requirements</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This is an official proctored test. Before proceeding:
          </Typography>
          <Typography component="ul">
            <li>Ensure you are in a quiet, well-lit room</li>
            <li>Your camera and microphone must be enabled</li>
            <li>No other applications should be running</li>
            <li>You must remain visible in the camera throughout the test</li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
          <Button onClick={initializeProctoring} variant="contained" color="primary">
            Start Test
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Proctoring Feed
            </Typography>
            <Box
              sx={{
                width: '100%',
                position: 'relative',
                paddingTop: '75%', // 4:3 aspect ratio
                backgroundColor: 'black',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Keep your face visible in the camera at all times
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OfficialTest;
