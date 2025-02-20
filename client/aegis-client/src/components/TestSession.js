import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "../hooks/useSubscription";
import {
  Container,
  Box,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  useTheme
} from "@mui/material";
import {
  Timer,
  RadioButtonChecked,
  FiberManualRecord,
  Star,
  ArrowBack,
  Assessment
} from "@mui/icons-material";

function TestSession() {
  const theme = useTheme();
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [recording, setRecording] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);
  const startTime = useRef(null);
  const timerRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isSubscriptionActive, handleSubscriptionRequired } = useSubscription();

  useEffect(() => {
    if (!isSubscriptionActive()) {
      handleSubscriptionRequired();
      return;
    }
    initializeTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, [isSubscriptionActive]);

  const [error, setError] = useState('');

  const initializeTest = async () => {
    try {
      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams(location.search);
      const paymentSessionId = searchParams.get("session_id");
      
      const res = await axios.post(
        "http://localhost:4000/api/exam/initialize",
        { 
          type: paymentSessionId ? "practice" : "official",
          paymentSessionId 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }

      setSessionId(res.data.sessionId);
      startRecording();
      fetchNextQuestion(res.data.sessionId);
      startTimer();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        setError('An active subscription is required to access practice tests');
        setLoading(false);
      } else {
        setError('Failed to initialize test. Please try again.');
      }
    }
  };

  const startTimer = () => {
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const formData = new FormData();
        formData.append("recording", blob);
        
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `http://localhost:4000/api/exam/${sessionId}/recording`,
            formData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.error("Failed to upload recording:", err);
        }
      };
      
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Please enable camera and microphone access");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const fetchNextQuestion = async (sid) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:4000/api/exam/${sid || sessionId}/next`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.completed) {
        await finalizeTest();
        return;
      }

      setCurrentQuestion(res.data);
      startTime.current = Date.now();
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch next question");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selected) return;

    const token = localStorage.getItem("token");
    const questionTimeSpent = Math.floor((Date.now() - startTime.current) / 1000);

    try {
      const res = await axios.post(
        `http://localhost:4000/api/exam/${sessionId}/answer`,
        {
          questionId: currentQuestion._id,
          answer: selected,
          timeSpent: questionTimeSpent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScore(res.data.currentScore);
      setIncorrectAnswers(res.data.incorrectAnswers);
      setSelected("");
      
      if (res.data.incorrectAnswers >= 5) {
        await finalizeTest();
      } else {
        fetchNextQuestion();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit answer");
    }
  };

  const finalizeTest = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:4000/api/exam/${sessionId}/finalize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      
      setTestComplete(true);
      setTestResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to finalize test");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" color="text.secondary">
            Initializing Test Session...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/pricing')}
            sx={{ mr: 2 }}
          >
            View Plans
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Return Home
          </Button>
        </Paper>
      </Container>
    );
  }

  if (testComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Assessment sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Test Complete
            </Typography>
          </Box>

          <Card sx={{ mb: 4, bgcolor: "primary.main", color: "white" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {testResults.finalScore.toFixed(2)}
              </Typography>
              <Typography variant="h6">
                Percentile: {testResults.percentile.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Performance Breakdown
          </Typography>

          <Grid container spacing={3}>
            {testResults.questionBreakdown.map((cat, idx) => (
              <Grid item xs={12} key={idx}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {cat.category}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      {cat.correct} / {cat.total} Correct
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {((cat.correct/cat.total)*100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(cat.correct/cat.total)*100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, p: 3, bgcolor: "grey.50", borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Average Difficulty: {testResults.averageDifficulty.toFixed(1)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Average Time: {testResults.timePerQuestion.toFixed(1)}s per question
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/dashboard")}
              sx={{ px: 4, py: 1.5 }}
            >
              Return to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {/* Status Bar */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 2
          }}
        >
          <Chip
            icon={<FiberManualRecord sx={{ 
              color: recording ? "error.main" : "grey.500",
              animation: recording ? "pulse 2s infinite" : "none",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 }
              }
            }} />}
            label={recording ? "Recording" : "Not Recording"}
            color={recording ? "error" : "default"}
            variant="outlined"
          />
          
          <Chip
            label={`Score: ${score.toFixed(2)}`}
            color="primary"
            variant="outlined"
          />
          
          <Chip
            icon={<Timer />}
            label={`${Math.floor(timeSpent/60)}:${(timeSpent%60).toString().padStart(2, '0')}`}
            variant="outlined"
          />
          
          <Chip
            label={`${5 - incorrectAnswers} attempts remaining`}
            color={incorrectAnswers >= 3 ? "error" : "default"}
            variant="outlined"
          />
        </Box>

        {/* Question Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
              Difficulty:
            </Typography>
            {[...Array(Math.round(currentQuestion.difficulty))].map((_, i) => (
              <Star key={i} sx={{ color: theme.palette.warning.main }} />
            ))}
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            {currentQuestion.prompt}
          </Typography>

          <RadioGroup
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <Grid container spacing={2}>
              {currentQuestion.choices.map((choice, idx) => (
                <Grid item xs={12} key={idx}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: "action.hover",
                        borderColor: "primary.main"
                      },
                      ...(selected === choice && {
                        borderColor: "primary.main",
                        bgcolor: "primary.lighter"
                      })
                    }}
                  >
                    <FormControlLabel
                      value={choice}
                      control={<Radio />}
                      label={choice}
                      sx={{ width: "100%", m: 0 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmitAnswer}
            disabled={!selected}
            startIcon={<RadioButtonChecked />}
            sx={{ px: 6, py: 1.5 }}
          >
            Submit Answer
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default TestSession;
