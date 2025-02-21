import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  VerifiedUser,
  TrendingUp,
  Security,
  Psychology,
  Assessment,
  Timeline,
  BusinessCenter,
  School
} from '@mui/icons-material';

const ReliabilityInfo = () => {
  const reliabilityFeatures = [
    {
      icon: <Psychology sx={{ color: '#1a237e' }} />,
      title: "AI-Enhanced Question Generation",
      description: "Our AI system dynamically modifies questions to ensure unique test experiences while maintaining consistent difficulty levels."
    },
    {
      icon: <Assessment sx={{ color: '#1a237e' }} />,
      title: "Adaptive Difficulty Scaling",
      description: "Questions become progressively challenging based on performance, providing a precise measure of capability."
    },
    {
      icon: <Security sx={{ color: '#1a237e' }} />,
      title: "Comprehensive Proctoring",
      description: "Advanced AI monitoring and browser lockdown ensure test integrity and prevent unauthorized assistance."
    },
    {
      icon: <TrendingUp sx={{ color: '#1a237e' }} />,
      title: "Statistical Validation",
      description: "Rigorous statistical analysis ensures score reliability and meaningful performance assessment."
    }
  ];

  const scoringInsights = [
    {
      icon: <Timeline />,
      title: "Performance Curve",
      description: "Scores are calculated using a sophisticated algorithm that considers question difficulty and response patterns."
    },
    {
      icon: <BusinessCenter />,
      title: "Industry Alignment",
      description: "Test content and scoring are aligned with current investment banking technical requirements."
    },
    {
      icon: <School />,
      title: "Skill Assessment",
      description: "Comprehensive evaluation of technical knowledge, problem-solving ability, and analytical thinking."
    }
  ];

  return (
    <Box sx={{ py: 8, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h2" 
          component="h2" 
          align="center"
          sx={{
            mb: 6,
            background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700
          }}
        >
          Test Reliability & Scoring
        </Typography>

        {/* Reliability Features */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {reliabilityFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      mb: 2,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      color: '#1a237e'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
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

        {/* Scoring Insights */}
        <Box
          sx={{
            background: 'white',
            borderRadius: '20px',
            p: 4,
            boxShadow: '0 8px 32px rgba(26, 35, 126, 0.1)',
          }}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h3"
                sx={{
                  mb: 4,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  color: '#1a237e'
                }}
              >
                Understanding Your Score
              </Typography>
              <List>
                {scoringInsights.map((insight, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        py: 2,
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'translateX(10px)'
                        }
                      }}
                    >
                      <ListItemIcon>
                        {insight.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: 600,
                              color: '#1a237e',
                              mb: 1
                            }}
                          >
                            {insight.title}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'Inter, sans-serif',
                              color: 'text.secondary'
                            }}
                          >
                            {insight.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < scoringInsights.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  p: 4,
                  background: 'rgba(26, 35, 126, 0.03)',
                  borderRadius: '16px',
                  border: '1px solid rgba(26, 35, 126, 0.1)'
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    color: '#1a237e'
                  }}
                >
                  Score Distribution
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    fontFamily: 'Inter, sans-serif',
                    color: 'text.secondary'
                  }}
                >
                  Our scoring system uses a normalized curve that accounts for:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <VerifiedUser sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Question difficulty level"
                      secondary="Higher scores for correctly answering harder questions"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Timeline sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Response time"
                      secondary="Efficiency in problem-solving is considered"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment sx={{ color: '#1a237e' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Consistency"
                      secondary="Pattern of correct answers across difficulty levels"
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ReliabilityInfo;
