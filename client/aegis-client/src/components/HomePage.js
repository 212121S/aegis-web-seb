// client/aegis-client/src/components/HomePage.js
import React from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper, 
  useTheme,
  Card,
  CardContent,
  CardActions
} from "@mui/material";
import { 
  Security, 
  School, 
  Speed, 
  Psychology,
  Shield
} from "@mui/icons-material";

function HomePage() {
  const theme = useTheme();

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: "AI-Powered Proctoring",
      description: "Advanced real-time monitoring ensures exam integrity with minimal intrusion"
    },
    {
      icon: <Shield sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: "Secure Environment",
      description: "Browser lockdown and system monitoring prevent unauthorized access"
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: "Adaptive Testing",
      description: "Dynamic question selection adjusts to student performance"
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: "Easy Setup",
      description: "Quick implementation with intuitive interface for all users"
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2
                }}
              >
                Secure Online Testing with Aegis
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4,
                  opacity: 0.9
                }}
              >
                The future of exam proctoring is here
              </Typography>
              <Button 
                href="/register" 
                variant="contained" 
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  },
                  px: 4,
                  py: 1.5
                }}
              >
                Get Started
              </Button>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
              <Shield sx={{ fontSize: 200, opacity: 0.9 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          sx={{ mb: 6 }}
        >
          Why Choose Aegis?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h3"
                    sx={{ mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box 
        sx={{ 
          bgcolor: 'grey.100',
          py: 8
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography 
              variant="h4" 
              component="h3"
              sx={{ mb: 3 }}
            >
              Ready to transform your online testing?
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                color: 'text.secondary'
              }}
            >
              Join leading institutions in providing secure and efficient online assessments
            </Typography>
            <Button 
              href="/register" 
              variant="contained" 
              size="large"
              sx={{
                px: 4,
                py: 1.5
              }}
            >
              Start Free Trial
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default HomePage;
