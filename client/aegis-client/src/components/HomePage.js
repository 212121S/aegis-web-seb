import React from 'react';
import { Box, ThemeProvider } from '@mui/material';
import theme from '../theme';
import HeroSection from './HeroSection';
import FeatureGrid from './FeatureGrid';
import AccommodationsSection from './AccommodationsSection';
import ReliabilityInfo from './ReliabilityInfo';

const HomePage = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <HeroSection />
        <FeatureGrid />
        <AccommodationsSection />
        <ReliabilityInfo />
      </Box>
    </ThemeProvider>
  );
}

export default HomePage;
