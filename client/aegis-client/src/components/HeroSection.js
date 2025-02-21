import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid,
  useTheme 
} from '@mui/material';
import { Shield } from '@mui/icons-material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.6; }
  100% { opacity: 0.4; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const HeroSection = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: '80vh', md: '85vh' },
        display: 'flex',
        alignItems: 'center',
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
          animation: `${pulse} 15s infinite`,
        }}
      />
      
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  mb: 2,
                  fontWeight: 800,
                  background: 'linear-gradient(45deg, #ffffff 30%, rgba(255,255,255,0.8) 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
                  maxWidth: '600px'
                }}
              >
                AI-powered, secure, and merit-based technical evaluations trusted by leading financial institutions
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  href="/register" 
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: '30px',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  Start Your Assessment
                </Button>
                
                <Button 
                  href="/learn-more"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)'
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: '30px',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
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
                  animation: `${pulse} 3s infinite`
                }
              }}
            >
              <Shield 
                sx={{ 
                  fontSize: { xs: 200, md: 280 },
                  opacity: 0.9,
                  animation: `${float} 6s ease-in-out infinite`,
                  color: 'white'
                }} 
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
      
      {/* Decorative bottom wave */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          backgroundSize: 'cover',
        }}
      />
    </Box>
  );
};

export default HeroSection;
