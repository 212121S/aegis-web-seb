import React, { useRef, useEffect, useState } from "react";
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
  useTheme
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  CheckCircle,
  Warning,
  Person,
  LightMode,
  Visibility
} from "@mui/icons-material";

function ProctoringMonitor() {
  const theme = useTheme();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [monitoringStats, setMonitoringStats] = useState({
    faceDetected: false,
    lightLevel: 0,
    movement: 0
  });

  useEffect(() => {
    startVideo();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulated monitoring updates
  useEffect(() => {
    if (stream) {
      const interval = setInterval(() => {
        // Simulate monitoring stats (replace with actual face-api.js implementation)
        setMonitoringStats({
          faceDetected: Math.random() > 0.1, // 90% chance face is detected
          lightLevel: Math.floor(Math.random() * 100),
          movement: Math.floor(Math.random() * 100)
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stream]);

  const startVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please ensure camera permissions are granted.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value, threshold) => {
    if (value >= threshold) return "success";
    if (value >= threshold * 0.6) return "warning";
    return "error";
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
          <Videocam sx={{ fontSize: 28, color: "primary.main", mr: 1 }} />
          <Typography variant="h5" component="h2">
            Proctoring Monitor
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            icon={<VideocamOff />}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 0,
                paddingBottom: "75%",
                bgcolor: "grey.900",
                borderRadius: 2,
                overflow: "hidden"
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
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

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Light Level
                    </Typography>
                    <Chip
                      icon={<LightMode />}
                      label={`${monitoringStats.lightLevel}%`}
                      color={getStatusColor(monitoringStats.lightLevel, 70)}
                      variant="outlined"
                      sx={{ width: "100%" }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Movement Detection
                    </Typography>
                    <Chip
                      icon={<Visibility />}
                      label={`${monitoringStats.movement}%`}
                      color={getStatusColor(monitoringStats.movement, 80)}
                      variant="outlined"
                      sx={{ width: "100%" }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default ProctoringMonitor;
