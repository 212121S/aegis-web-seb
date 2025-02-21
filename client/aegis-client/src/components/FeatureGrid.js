import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Security,
  Shield,
  Psychology,
  AutoGraph,
  Timer,
  Assessment,
  Analytics,
  WorkOutline
} from '@mui/icons-material';

const features = [
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: "AI-Powered Proctoring",
    description: "Advanced real-time monitoring ensures exam integrity with minimal intrusion"
  },
  {
    icon: <Shield sx={{ fontSize: 40 }} />,
    title: "Secure Environment",
    description: "Browser lockdown and system monitoring prevent unauthorized access"
  },
  {
    icon: <Psychology sx={{ fontSize: 40 }} />,
    title: "Adaptive Testing",
    description: "Dynamic question selection adjusts to student performance"
  },
  {
    icon: <AutoGraph sx={{ fontSize: 40 }} />,
    title: "Merit-Based Results",
    description: "Fair and accurate assessment of technical skills for investment banking"
  }
];

const processSteps = [
  {
    icon: <Timer />,
    title: "30-60 Minute Duration",
    description: "Comprehensive assessment of technical knowledge"
  },
  {
    icon: <Assessment />,
    title: "Adaptive Difficulty",
    description: "Questions adjust based on performance"
  },
  {
    icon: <Analytics />,
    title: "Real-time Analysis",
    description: "AI-powered monitoring and evaluation"
  },
  {
    icon: <WorkOutline />,
    title: "Industry Recognition",
    description: "Results trusted by leading firms"
  }
];

const FeatureGrid = () => {
  const theme = useTheme();

  const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)'
    }
  };

  const gradientText = {
    background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontFamily: 'Poppins, sans-serif'
  };

  return (
    <Box sx={{ py: 12, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        {/* Features Section */}
        <Typography 
          variant="h2" 
          align="center" 
          sx={{ 
            mb: 8,
            ...gradientText,
            fontWeight: 700
          }}
        >
          Why Leading Firms Trust Aegis
        </Typography>

        <Grid container spacing={4} sx={{ mb: 12 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  ...glassmorphismStyle,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                  <Box 
                    sx={{ 
                      mb: 3, 
                      color: theme.palette.primary.main,
                      transform: 'scale(1.2)'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h3"
                    sx={{ 
                      mb: 2,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      color: theme.palette.primary.main
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Process Section */}
        <Typography 
          variant="h2" 
          align="center" 
          sx={{ 
            mb: 8,
            ...gradientText,
            fontWeight: 700
          }}
        >
          The Assessment Process
        </Typography>

        <Grid container spacing={6}>
          {processSteps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box
                sx={{
                  textAlign: 'center',
                  position: 'relative',
                  '&::after': index < processSteps.length - 1 ? {
                    content: '""',
                    position: 'absolute',
                    top: '20%',
                    right: '-10%',
                    width: '20%',
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, transparent 100%)`,
                    display: { xs: 'none', md: 'block' }
                  } : {}
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'rgba(26, 35, 126, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: theme.palette.primary.main
                  }}
                >
                  {step.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {step.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeatureGrid;
