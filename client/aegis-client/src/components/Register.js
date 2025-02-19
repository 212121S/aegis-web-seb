// client/aegis-client/src/components/Register.js
import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack
} from "@mui/material";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    phone: ""
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      // 1) If your server is DEPLOYED (e.g., Render, Heroku), use that HTTPS URL:
      // const serverURL = "https://YOUR-DEPLOYED-SERVER.com/api/auth/register";

      // 2) If you’re still working locally, uncomment the line below instead:
      // const serverURL = "http://localhost:4000/api/auth/register";

      const serverURL = "https://YOUR-DEPLOYED-SERVER.com/api/auth/register"; // Replace with your actual backend URL.

      const res = await axios.post(serverURL, formData);

      if (res.status === 201) {
        setMessage("Registration successful! You can now log in.");
        setFormData({ email: "", username: "", password: "", phone: "" });
      }
    } catch (err) {
      console.error(err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Create an Account
      </Typography>

      {message && (
        <Alert severity="success" style={{ marginBottom: "1rem" }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" style={{ marginBottom: "1rem" }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            label="Username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
          />
          <Button variant="contained" color="primary" type="submit">
            Register
          </Button>
        </Stack>
      </form>
    </Container>
  );
}

export default Register;