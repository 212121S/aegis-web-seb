import React, { useEffect, useRef } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  useTheme,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  useScrollTrigger,
  Slide
} from "@mui/material";
import ReliabilityInfo from './ReliabilityInfo';
import { 
  Security, 
  School, 
  Speed, 
  Psychology,
  Shield,
  CheckCircle,
  Timeline,
  Analytics,
  AccessibilityNew,
  Gavel,
  Assessment,
  WorkOutline,
  Timer,
  AutoGraph
} from "@mui/icons-material";

// Scroll animation component
const ScrollReveal = ({ children, threshold = 0.1 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    const current = ref.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [threshold]);

  return (
    <Fade in={isVisible} timeout={1000}>
      <div ref={ref}>{children}</div>
    </Fade>
  );
};

function HomePage() {
  const theme = useTheme();
  
  // Custom gradient styles
  const gradientText = {
    background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontFamily: 'Poppins, sans-serif'
  };

  const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)'
    }
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "AI-Powered Proctoring",
      description: "Advanced real-time monitoring ensures exam integrity with minimal intrusion"
    },
    {
      icon: <Shield sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Secure Environment",
      description: "Browser lockdown and system monitoring prevent unauthorized access"
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Adaptive Testing",
      description: "Dynamic question selection adjusts to student performance"
    },
    {
      icon: <AutoGraph sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Merit-Based Results",
      description: "Fair and accurate assessment of technical skills for investment banking"
    }
  ];

  const testProcess = [
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

  const accommodations = [
    "Extended time allocations",
    "Screen reader compatibility",
    "Modified display settings",
    "Break time adjustments",
    "Alternative format materials"
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section with Gradient Background */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0%, transparent 50%)',
            animation: 'pulse 15s infinite'
          }}
        />
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <ScrollReveal>
                <Typography 
                  variant="h1" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontFamily: 'Poppins, sans-serif',
                    letterSpacing: '-0.5px'
                  }}
                >
                  The Future of Investment Banking Assessment
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  AI-powered, secure, and merit-based technical evaluations
                </Typography>
                <Button 
                  href="/register" 
                  variant="contained" 
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#1a237e',
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    },
                    px: 6,
                    py: 2,
                    borderRadius: '30px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Start Your Assessment
                </Button>
              </ScrollReveal>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-20%',
                    left: '-20%',
                    right: '-20%',
                    bottom: '-20%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 3s infinite'
                  }
                }}
              >
                <Shield 
                  sx={{ 
                    fontSize: 280, 
                    opacity: 0.9,
                    animation: 'float 6s ease-in-out infinite'
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section with Glassmorphism */}
      <Container maxWidth="lg" sx={{ my: 12 }}>
        <ScrollReveal>
          <Typography 
            variant="h2" 
            component="h2" 
            align="center" 
            sx={{ 
              mb: 8,
              ...gradientText,
              fontWeight: 700
            }}
          >
            Why Leading Firms Trust Aegis
          </Typography>
        </ScrollReveal>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <ScrollReveal threshold={0.2}>
                <Card 
                  sx={{ 
                    ...glassmorphismStyle,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box sx={{ mb: 3, transform: 'scale(1.2)' }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      gutterBottom 
                      variant="h5" 
                      component="h3"
                      sx={{ 
                        mb: 2,
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
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
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Test Process Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 12 }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Typography 
              variant="h2" 
              component="h2" 
              align="center" 
              sx={{ 
                mb: 8,
                ...gradientText,
                fontWeight: 700
              }}
            >
              The Assessment Process
            </Typography>
          </ScrollReveal>

          <Grid container spacing={6}>
            {testProcess.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <ScrollReveal threshold={0.2}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      position: 'relative',
                      '&::after': index < testProcess.length - 1 ? {
                        content: '""',
                        position: 'absolute',
                        top: '20%',
                        right: '-10%',
                        width: '20%',
                        height: '2px',
                        background: 'linear-gradient(90deg, #1a237e 0%, transparent 100%)',
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
                        color: '#1a237e'
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600
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
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Accommodations Section */}
      <Container maxWidth="lg" sx={{ my: 12 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <ScrollReveal>
              <Typography
                variant="h2"
                sx={{
                  mb: 4,
                  ...gradientText,
                  fontWeight: 700
                }}
              >
                Comprehensive Accommodations
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 4, fontFamily: 'Inter, sans-serif' }}
              >
                We're committed to providing equal access to all candidates, following LSAT and GMAT accommodation standards.
              </Typography>
              <List>
                {accommodations.map((item, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{
                        sx: { fontFamily: 'Inter, sans-serif' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </ScrollReveal>
          </Grid>
          <Grid item xs={12} md={6}>
            <ScrollReveal>
              <Box
                sx={{
                  ...glassmorphismStyle,
                  p: 4,
                  bgcolor: 'rgba(26, 35, 126, 0.03)'
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600
                  }}
                >
                  Documentation Requirements
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Submit your accommodation request with:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Gavel sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText primary="Professional documentation of disability" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessibilityNew sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText primary="Specific accommodation requirements" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Timeline sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText primary="History of previous accommodations" />
                  </ListItem>
                </List>
              </Box>
            </ScrollReveal>
          </Grid>
        </Grid>
      </Container>

      {/* Reliability Info Section */}
      <ReliabilityInfo />

      {/* CTA Section with Gradient Background */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="md">
          <ScrollReveal>
            <Box textAlign="center">
              <Typography 
                variant="h3" 
                component="h3"
                sx={{ 
                  mb: 3,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700
                }}
              >
                Ready to Demonstrate Your Expertise?
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 6,
                  opacity: 0.9,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400
                }}
              >
                Join top candidates in showcasing your investment banking knowledge through our merit-based assessment platform
              </Typography>
              <Button 
                href="/register" 
                variant="contained" 
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: '#1a237e',
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                  },
                  px: 6,
                  py: 2,
                  borderRadius: '30px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Begin Your Journey
              </Button>
            </Box>
          </ScrollReveal>
        </Container>
      </Box>

      {/* Custom Animations */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 0.6; }
            100% { opacity: 0.4; }
          }
        `}
      </style>
    </Box>
  );
}

export default HomePage;
