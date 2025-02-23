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
  useTheme
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

  // Form state
  const [selectedVerticals, setSelectedVerticals] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState([3, 6]); // Default range 3-6
  const [questionCount, setQuestionCount] = useState(5);
  const [useAI, setUseAI] = useState(true);

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

  const handleGenerateTest = async () => {
    try {
      if (!selectedVerticals.length || !selectedRoles.length || !selectedTopics.length) {
        setError('Please select at least one option for each category');
        return;
      }

      setGenerating(true);
      setError(null);

      const testSession = await examAPI.generatePracticeTest({
        verticals: selectedVerticals,
        roles: selectedRoles,
        topics: selectedTopics,
        difficulty,
        count: questionCount,
        useAI
      });

      // Store test session in localStorage for the practice test component
      localStorage.setItem('currentPracticeTest', JSON.stringify(testSession));
      navigate('/practice-test');
    } catch (error) {
      console.error('Failed to generate test:', error);
      setError(error.message || 'Failed to generate test. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

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
              onChange={(e) => setSelectedVerticals(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
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
              onChange={(e) => setSelectedRoles(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
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
              onChange={(e) => setSelectedTopics(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {config?.topics.map((topic) => (
                <MenuItem key={topic} value={topic}>
                  {topic}
                </MenuItem>
              ))}
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
                Generating Test...
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
