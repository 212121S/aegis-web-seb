import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Fade,
  useTheme
} from '@mui/material';
import { School, Security, Timeline, Psychology } from '@mui/icons-material';

function AboutPage() {
  const theme = useTheme();

  const features = [
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'Expert-Crafted Tests',
      description: 'Our tests are designed by industry professionals with years of experience in test preparation.'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure Testing Environment',
      description: 'State-of-the-art proctoring technology ensures test integrity and fairness.'
    },
    {
      icon: <Timeline sx={{ fontSize: 40 }} />,
      title: 'Performance Analytics',
      description: 'Detailed analytics and progress tracking to help you improve.'
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: 'Adaptive Learning',
      description: 'Our system adapts to your performance to provide personalized practice materials.'
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Fade in timeout={1000}>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              About Aegis
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
              Empowering students with advanced test preparation technology
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography gutterBottom variant="h5" component="h2">
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" gutterBottom>
              Our Mission
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
              At Aegis, we're committed to revolutionizing test preparation through technology.
              Our platform combines advanced proctoring capabilities with comprehensive
              learning tools to provide students with the most effective and secure testing experience.
            </Typography>
            <Button
              variant="contained"
              size="large"
              color="primary"
              href="/register"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
              }}
            >
              Start Your Journey
            </Button>
          </Box>
        </Container>
      </Fade>
    </Box>
  );
}

export default AboutPage;
