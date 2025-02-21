import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  Gavel,
  AccessibilityNew,
  Timeline,
  Description,
  Timer,
  Settings,
  Visibility
} from '@mui/icons-material';

const accommodations = [
  {
    icon: <Timer />,
    title: "Extended Time Allocations",
    description: "Additional time provided based on documented needs"
  },
  {
    icon: <Visibility />,
    title: "Screen Reader Compatibility",
    description: "Full support for assistive technology"
  },
  {
    icon: <Settings />,
    title: "Modified Display Settings",
    description: "Customizable font sizes, colors, and contrast"
  },
  {
    icon: <Description />,
    title: "Alternative Format Materials",
    description: "Content available in multiple accessible formats"
  }
];

const documentationRequirements = [
  {
    icon: <Gavel />,
    text: "Professional documentation of disability"
  },
  {
    icon: <AccessibilityNew />,
    text: "Specific accommodation requirements"
  },
  {
    icon: <Timeline />,
    text: "History of previous accommodations"
  }
];

const AccommodationsSection = () => {
  const theme = useTheme();

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
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)'
    }
  };

  return (
    <Box sx={{ py: 12, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
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

            <Grid container spacing={3}>
              {accommodations.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: '100%',
                      bgcolor: 'rgba(26, 35, 126, 0.03)',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          mr: 2,
                          color: theme.palette.primary.main,
                          display: 'flex'
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 600,
                          color: theme.palette.primary.main
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {item.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                ...glassmorphismStyle,
                p: 4,
                bgcolor: 'rgba(26, 35, 126, 0.02)'
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  mb: 3,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color: theme.palette.primary.main
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
                To ensure we provide appropriate accommodations, please submit:
              </Typography>
              
              <List>
                {documentationRequirements.map((req, index) => (
                  <ListItem key={index} sx={{ py: 2 }}>
                    <ListItemIcon>
                      <Box sx={{ color: theme.palette.primary.main }}>
                        {req.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={req.text}
                      primaryTypographyProps={{
                        sx: { 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(26, 35, 126, 0.05)', borderRadius: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontStyle: 'italic'
                  }}
                >
                  Note: Documentation should be current and provided by qualified professionals. Early submission is recommended to ensure accommodations can be arranged before your test date.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AccommodationsSection;
