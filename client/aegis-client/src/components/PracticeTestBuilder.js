import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../utils/axios';

const PracticeTestBuilder = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryProgress, setRetryProgress] = useState(0);
  const [retryMessage, setRetryMessage] = useState('');
  const MAX_RETRIES = 3;

  // Form state
  const [selectedVerticals, setSelectedVerticals] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState([3, 6]); // Default range 3-6
  const [questionCount, setQuestionCount] = useState(5);
  const [useAI, setUseAI] = useState(true);
  const [questionType, setQuestionType] = useState('multiple-choice');

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const config = await examAPI.getPracticeConfig();
      setConfig(config);
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      setError('Failed to load test configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle "All" selection
  const handleAllSelection = (currentSelection, allOptions, value) => {
    if (value.includes('All')) {
      // If "All" is being selected, return just "All"
      if (!currentSelection.includes('All')) {
        return ['All'];
      }
      // If "All" is being deselected, return empty array
      return [];
    }
    // If a regular option is selected while "All" is selected, remove "All"
    if (currentSelection.includes('All')) {
      return value.filter(v => v !== 'All');
    }
    return value;
  };

  // Helper function to delay execution with exponential backoff
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const generateTestWithRetry = async (params, currentRetry = 0) => {
    try {
      // Update retry UI
      setRetryCount(currentRetry);
      setRetryProgress(0);
      
      if (currentRetry > 0) {
        setRetryMessage(`Attempt ${currentRetry}/${MAX_RETRIES} - Retrying test generation...`);
      }
      
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setRetryProgress(prev => Math.min(prev + 5, 95));
      }, 300);
      
      // Attempt to generate the test
      const testSession = await examAPI.generatePracticeTest(params);
      
      // Clear progress interval
      clearInterval(progressInterval);
      setRetryProgress(100);
      
      // Success - store test session and navigate
      localStorage.setItem('currentPracticeTest', JSON.stringify(testSession));
      navigate('/practice-test');
      
      return true;
    } catch (error) {
      console.error(`Attempt ${currentRetry + 1} failed:`, error);
      
      // If we haven't reached max retries, try again with exponential backoff
      if (currentRetry < MAX_RETRIES - 1) {
        const backoffTime = Math.pow(2, currentRetry) * 1000; // Exponential backoff: 1s, 2s, 4s, etc.
        setRetryMessage(`Attempt ${currentRetry + 1} failed. Retrying in ${backoffTime/1000} seconds...`);
        
        // Wait with backoff before retrying
        await delay(backoffTime);
        
        // Recursive retry with incremented counter
        return generateTestWithRetry(params, currentRetry + 1);
      } else {
        // Max retries reached, throw the error to be caught by the caller
        throw error;
      }
    }
  };

  const handleGenerateTest = async () => {
    try {
      if (!selectedVerticals.length || !selectedRoles.length || !selectedTopics.length) {
        setError('Please select at least one option for each category');
        return;
      }

      setGenerating(true);
      setError(null);
      setRetryCount(0);
      setRetryMessage('');

      // If "All" is selected, use all options from config
      const verticals = selectedVerticals.includes('All') ? config.verticals : selectedVerticals;
      const roles = selectedRoles.includes('All') ? config.roles : selectedRoles;
      const topics = selectedTopics.includes('All') ? config.topics : selectedTopics;

      const params = {
        verticals: verticals.filter(v => v !== 'All'),  // Filter out "All" from the arrays
        roles: roles.filter(r => r !== 'All'),
        topics: topics.filter(t => t !== 'All'),
        difficulty,
        count: questionCount,
        useAI,
        questionType
      };

      // Call the retry function
      await generateTestWithRetry(params);
      
    } catch (error) {
      console.error('All retry attempts failed:', error);
      setError(error.message || 'Failed to generate test after multiple attempts. Please try again with different criteria.');
    } finally {
      setGenerating(false);
      setRetryMessage('');
      setRetryProgress(0);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Helper function to render selected values
  const renderSelectedValues = (selected) => {
    if (selected.includes('All')) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip key="All" label="All" />
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selected.map((value) => (
          <Chip key={value} label={value} />
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Practice Test Builder
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Customize your practice test by selecting industry verticals, roles, topics, and difficulty level.
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Industry Verticals */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Industry Verticals</InputLabel>
            <Select
              multiple
              value={selectedVerticals}
              onChange={(e) => setSelectedVerticals(handleAllSelection(selectedVerticals, config.verticals, e.target.value))}
              renderValue={renderSelectedValues}
            >
              <MenuItem key="All" value="All">All</MenuItem>
              {config?.verticals.map((vertical) => (
                <MenuItem key={vertical} value={vertical}>
                  {vertical}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Roles */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Roles</InputLabel>
            <Select
              multiple
              value={selectedRoles}
              onChange={(e) => setSelectedRoles(handleAllSelection(selectedRoles, config.roles, e.target.value))}
              renderValue={renderSelectedValues}
            >
              <MenuItem key="All" value="All">All</MenuItem>
              {config?.roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Topics */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Topics</InputLabel>
            <Select
              multiple
              value={selectedTopics}
              onChange={(e) => setSelectedTopics(handleAllSelection(selectedTopics, config.topics, e.target.value))}
              renderValue={renderSelectedValues}
            >
              <MenuItem key="All" value="All">All</MenuItem>
              {config?.topics.map((topic) => (
                <MenuItem key={topic} value={topic}>
                  {topic}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Question Type */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Question Type</InputLabel>
            <Select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
              <MenuItem value="written-answer">Written Answer</MenuItem>
            </Select>
          </FormControl>

          {/* Difficulty Range */}
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Difficulty Range: {difficulty[0]} - {difficulty[1]}
            </Typography>
            <Slider
              value={difficulty}
              onChange={(e, newValue) => setDifficulty(newValue)}
              valueLabelDisplay="auto"
              min={config?.difficultyRange.min || 1}
              max={config?.difficultyRange.max || 8}
            />
          </Box>

          {/* Question Count */}
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Number of Questions: {questionCount}
            </Typography>
            <Slider
              value={questionCount}
              onChange={(e, newValue) => setQuestionCount(newValue)}
              valueLabelDisplay="auto"
              step={5}
              marks
              min={5}
              max={20}
            />
          </Box>

          {/* AI Generation Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                color="primary"
              />
            }
            label="Use AI to generate unique questions"
            sx={{ mb: 3 }}
          />

          {/* Retry Progress */}
          {generating && retryCount > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {retryMessage}
              </Typography>
              <LinearProgress variant="determinate" value={retryProgress} />
            </Box>
          )}

          {/* Generate Button */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleGenerateTest}
            disabled={generating}
          >
            {generating ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                {retryCount === 0 ? 'Generating Practice Test... This may take a minute' : `Retry ${retryCount}/${MAX_RETRIES} in progress...`}
              </>
            ) : (
              'Generate Practice Test'
            )}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default PracticeTestBuilder;
