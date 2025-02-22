import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  School,
  Cake,
  Shield
} from "@mui/icons-material";

const steps = [
  'Basic Information',
  'Email Verification',
  'Phone Verification',
  'Complete'
];

function Register() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    phone: "",
    university: null,
    dateOfBirth: null,
    tosAccepted: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [tosDialogOpen, setTosDialogOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await axiosInstance.get('/api/verification/universities');
      setUniversities(response.data);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    }
  };

  const validateBasicInfo = () => {
    if (!formData.email) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.username) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (!formData.phone) {
      setError("Phone number is required");
      return false;
    }
    if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.replace(/\s+/g, ''))) {
      setError("Please enter a valid phone number");
      return false;
    }
    if (!formData.university) {
      setError("University is required");
      return false;
    }
    if (!formData.dateOfBirth) {
      setError("Date of birth is required");
      return false;
    }
    const birthDate = new Date(formData.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      setError("You must be at least 13 years old");
      return false;
    }
    if (!formData.tosAccepted) {
      setError("You must accept the Terms of Service");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmitBasicInfo = async () => {
    if (!validateBasicInfo()) return;

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post('/api/auth/register', {
        ...formData,
        university: formData.university._id,
        dateOfBirth: formData.dateOfBirth,
        tosAcceptedDate: new Date().toISOString()
      });

      // Skip verification steps for testing
      setSuccess(true);
      setActiveStep(3);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await axiosInstance.get(`/api/verification/email/verify/${verificationCode}`);
      await axiosInstance.post('/api/verification/phone/send');
      setVerificationCode("");
      setActiveStep(2);
    } catch (err) {
      setError("Invalid verification code");
    }
  };

  const handleVerifyPhone = async () => {
    try {
      await axiosInstance.post('/api/verification/phone/verify', {
        code: verificationCode
      });
      setSuccess(true);
      setActiveStep(3);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError("Invalid verification code");
    }
  };

  const handleResendEmail = async () => {
    try {
      await axiosInstance.post('/api/verification/email/resend');
      setError("Verification email resent");
    } catch (err) {
      setError("Failed to resend verification email");
    }
  };

  const handleResendPhone = async () => {
    try {
      await axiosInstance.post('/api/verification/phone/resend');
      setError("Verification SMS resent");
    } catch (err) {
      setError("Failed to resend verification SMS");
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!error && error.includes("email")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              error={!!error && error.includes("username")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!error && error.includes("password")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="phone"
              label="Phone Number"
              type="tel"
              id="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              error={!!error && error.includes("phone")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              id="university"
              options={universities}
              getOptionLabel={(option) => option.name}
              value={formData.university}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, university: newValue }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="normal"
                  required
                  fullWidth
                  label="University"
                  error={!!error && error.includes("university")}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="date"
              name="dateOfBirth"
              label="Date of Birth"
              value={formData.dateOfBirth || ''}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  dateOfBirth: e.target.value
                }));
              }}
              error={!!error && error.includes("birth")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Cake color="action" />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.tosAccepted}
                  onChange={(e) => setFormData(prev => ({ ...prev, tosAccepted: e.target.checked }))}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{" "}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      setTosDialogOpen(true);
                    }}
                  >
                    Terms of Service
                  </Link>
                </Typography>
              }
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              onClick={handleSubmitBasicInfo}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Continue"
              )}
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please check your email for a verification code.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleVerifyEmail}
            >
              Verify Email
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={handleResendEmail}
            >
              Resend Code
            </Button>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please check your phone for a verification code.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleVerifyPhone}
            >
              Verify Phone
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={handleResendPhone}
            >
              Resend Code
            </Button>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Registration Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Redirecting to login...
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Shield sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Create Account
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registration successful! Redirecting to login...
            </Alert>
          )}

          {getStepContent(activeStep)}

          {activeStep === 0 && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog
        open={tosDialogOpen}
        onClose={() => setTosDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Terms of Service</DialogTitle>
        <DialogContent>
          <iframe
            src="/terms-of-service.html"
            style={{ width: '100%', height: '60vh', border: 'none' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTosDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Register;
