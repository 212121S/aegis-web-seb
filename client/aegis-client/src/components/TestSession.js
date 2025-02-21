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
  Assessment,
  Extension
} from "@mui/icons-material";
import { proctorService } from "../services/ProctorService";

function TestSession() {
  const theme = useTheme();
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [proctoringReady, setProctoringReady] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState({
    faceDetected: false,
    multipleFaces: false,
    lookingAway: false,
    backgroundNoise: false
  });
  
  const startTime = useRef(null);
  const timerRef = useRef(null);
  const proctoringInterval = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isSubscriptionActive, handleSubscriptionRequired } = useSubscription();

  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSubscriptionActive()) {
      handleSubscriptionRequired();
      return;
    }

    const setupProctoring = async () => {
      try {
        const requirements = await proctorService.checkRequirements();
        if (!requirements.browserSupported || !requirements.extensionInstalled || !requirements.systemRequirementsMet) {
          setError('Please ensure your browser is supported and the proctoring extension is installed.');
          return;
        }

        await proctorService.initialize();
        setProctoringReady(true);
        
        // Set up proctoring event listeners
        proctorService.onEvent('face_detected', () => 
          setProctoringStatus(prev => ({ ...prev, faceDetected: true }))
        );
        
        proctorService.onEvent('multiple_faces', () => {
          setProctoringStatus(prev => ({ ...prev, multipleFaces: true }));
          setError('Multiple faces detected. This incident will be reported.');
        });
        
        proctorService.onEvent('looking_away', () => {
          setProctoringStatus(prev => ({ ...prev, lookingAway: true }));
          setError('Please keep your eyes on the screen.');
        });
        
        proctorService.onEvent('background_noise', () => {
          setProctoringStatus(prev => ({ ...prev, backgroundNoise: true }));
        });

        // Reset warning flags periodically
        proctoringInterval.current = setInterval(() => {
          setProctoringStatus(prev => ({
            ...prev,
            multipleFaces: false,
            lookingAway: false,
            backgroundNoise: false
          }));
        }, 5000);

        // Initialize test after proctoring is ready
        initializeTest();
      } catch (err) {
        console.error('Failed to initialize proctoring:', err);
        setError('Failed to initialize proctoring. Please refresh and try again.');
      }
    };

    setupProctoring();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (proctoringInterval.current) clearInterval(proctoringInterval.current);
      proctorService.terminate();
    };
  }, [isSubscriptionActive]);

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
      setError("Failed to fetch next question");
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
      setError("Failed to submit answer");
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
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (proctoringInterval.current) clearInterval(proctoringInterval.current);
      proctorService.terminate();
      
      setTestComplete(true);
      setTestResults(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to finalize test");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" color="text.secondary">
            {proctoringReady ? "Loading Test..." : "Initializing Proctoring..."}
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
            icon={<Extension sx={{ 
              color: proctoringStatus.faceDetected ? "success.main" : "error.main",
              animation: proctoringStatus.faceDetected ? "none" : "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 }
              }
            }} />}
            label={proctoringStatus.faceDetected ? "Proctoring Active" : "Face Not Detected"}
            color={proctoringStatus.faceDetected ? "success" : "error"}
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
            disabled={!selected || !proctoringStatus.faceDetected}
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
