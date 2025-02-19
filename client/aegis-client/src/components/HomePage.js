// client/aegis-client/src/components/HomePage.js
import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";

function HomePage() {
  return (
    <Container maxWidth="md" style={{ marginTop: "2rem" }}>
      <Box textAlign="center">
        <Typography variant="h3" gutterBottom>
          Welcome to Aegis
        </Typography>
        <Typography variant="body1" paragraph>
          Aegis is a cutting-edge exam proctoring and testing platform
          designed to ensure academic integrity and streamline the assessment
          process. Our advanced AI-driven solutions help institutions and
          organizations maintain rigorous standards while enhancing the user
          experience.
        </Typography>

        <Typography variant="h5" gutterBottom>
          Why Aegis?
        </Typography>
        <Typography variant="body2" paragraph>
          - Real-time proctoring with AI<br />
          - Secure browser lockdown<br />
          - Adaptive testing capabilities<br />
          - Easy setup & user-friendly interface
        </Typography>

        <Button 
          href="/register" 
          variant="contained" 
          color="primary" 
          size="large"
          style={{ marginTop: "2rem" }}
        >
          Get Started
        </Button>
      </Box>
    </Container>
  );
}

export default HomePage;