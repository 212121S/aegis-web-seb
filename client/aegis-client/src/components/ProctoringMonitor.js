import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  CheckCircle,
  Warning,
  Person,
  LightMode,
  Visibility,
  Extension,
  Refresh
} from "@mui/icons-material";
import { proctorService } from "../services/ProctorService";

function ProctoringMonitor() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [monitoringStats, setMonitoringStats] = useState({
    faceDetected: false,
    multipleFaces: false,
    lookingAway: false,
    backgroundNoise: false
  });

  useEffect(() => {
    checkRequirements();
    return () => {
      proctorService.terminate();
    };
  }, []);

  const checkRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      const reqs = await proctorService.checkRequirements();
      setRequirements(reqs);
      
      if (reqs.browserSupported && reqs.extensionInstalled && reqs.systemRequirementsMet) {
        await initializeProctoring();
      }
    } catch (err) {
      console.error("Error checking proctoring requirements:", err);
      setError("Failed to verify proctoring requirements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeProctoring = async () => {
    try {
      await proctorService.initialize();
      
      // Subscribe to proctoring events
      proctorService.onEvent('face_detected', () => 
        setMonitoringStats(prev => ({ ...prev, faceDetected: true }))
      );
      
      proctorService.onEvent('multiple_faces', () =>
        setMonitoringStats(prev => ({ ...prev, multipleFaces: true }))
      );
      
      proctorService.onEvent('looking_away', () =>
        setMonitoringStats(prev => ({ ...prev, lookingAway: true }))
      );
      
      proctorService.onEvent('background_noise', () =>
        setMonitoringStats(prev => ({ ...prev, backgroundNoise: true }))
      );
      
      // Reset flags periodically
      setInterval(() => {
        setMonitoringStats(prev => ({
          ...prev,
          multipleFaces: false,
          lookingAway: false,
          backgroundNoise: false
        }));
      }, 5000);
      
    } catch (err) {
      console.error("Error initializing proctoring:", err);
      setError("Failed to initialize proctoring. Please refresh and try again.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          borderRadius: 2,
          bgcolor: "background.paper" 
        }}
      >
        <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
          <Extension sx={{ fontSize: 28, color: "primary.main", mr: 1 }} />
          <Typography variant="h5" component="h2">
            Proctoring Status
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            icon={<Warning />}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography color="text.secondary">
              Checking proctoring requirements...
            </Typography>
          </Box>
        ) : requirements ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Requirements
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<CheckCircle />}
                        label="Browser Supported"
                        color={requirements.browserSupported ? "success" : "error"}
                        sx={{ width: "100%" }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<Extension />}
                        label="Proctoring Extension"
                        color={requirements.extensionInstalled ? "success" : "error"}
                        sx={{ width: "100%" }}
                      />
                    </Box>

                    <Box>
                      <Chip
                        icon={<Videocam />}
                        label="System Check"
                        color={requirements.systemRequirementsMet ? "success" : "error"}
                        sx={{ width: "100%" }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monitoring Status
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<Person />}
                        label={monitoringStats.faceDetected ? "Face Detected" : "No Face Detected"}
                        color={monitoringStats.faceDetected ? "success" : "error"}
                        sx={{ width: "100%" }}
                      />
                    </Box>

                    {monitoringStats.multipleFaces && (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          icon={<Warning />}
                          label="Multiple Faces Detected"
                          color="error"
                          sx={{ width: "100%" }}
                        />
                      </Box>
                    )}

                    {monitoringStats.lookingAway && (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          icon={<Visibility />}
                          label="Looking Away"
                          color="warning"
                          sx={{ width: "100%" }}
                        />
                      </Box>
                    )}

                    {monitoringStats.backgroundNoise && (
                      <Box>
                        <Chip
                          icon={<Warning />}
                          label="Background Noise Detected"
                          color="warning"
                          sx={{ width: "100%" }}
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error" gutterBottom>
              Failed to verify proctoring requirements
            </Typography>
            <Button
              variant="contained"
              onClick={checkRequirements}
              startIcon={<Refresh />}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ProctoringMonitor;
