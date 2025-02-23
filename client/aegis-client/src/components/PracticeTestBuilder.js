import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { examAPI } from '../utils/axios';

const PracticeTestBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [selectedVerticals, setSelectedVerticals] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState([3, 6]); // Default range
  const [questionCount, setQuestionCount] = useState(10);
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await examAPI.get('/practice/configuration');
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError('Failed to load test configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setGenerating(true);
      setError(null);

      const response = await examAPI.post('/practice/generate', {
        verticals: selectedVerticals,
        roles: selectedRoles,
        topics: selectedTopics,
        difficulty: Array.from(
          { length: difficulty[1] - difficulty[0] + 1 },
          (_, i) => difficulty[0] + i
        ),
        count: questionCount,
        useAI
      });

      // Navigate to test session with the generated questions
      navigate('/practice-test', { 
        state: { 
          testSession: response.data,
          config: {
            verticals: selectedVerticals,
            roles: selectedRoles,
            topics: selectedTopics,
            difficulty,
            useAI
          }
        }
      });
    } catch (err) {
      console.error('Failed to generate test:', err);
      setError('Failed to generate practice test. Please try again.');
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadConfiguration}>
          Try Again
        </Button>
      </Container>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Practice Test Builder
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Customize your practice test by selecting industry verticals, roles, topics, and difficulty level.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Industry Verticals */}
            <FormControl fullWidth>
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
                {config.verticals.map((vertical) => (
                  <MenuItem key={vertical} value={vertical}>
                    {vertical}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Roles */}
            <FormControl fullWidth>
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
                {config.roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Topics */}
            <FormControl fullWidth>
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
                {config.topics.map((topic) => (
                  <MenuItem key={topic} value={topic}>
                    {topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Difficulty Range */}
            <Box>
              <Typography gutterBottom>
                Difficulty Range (1-8)
              </Typography>
              <Slider
                value={difficulty}
                onChange={(e, newValue) => setDifficulty(newValue)}
                valueLabelDisplay="auto"
                min={1}
                max={8}
                marks
              />
            </Box>

            {/* Question Count */}
            <Box>
              <Typography gutterBottom>
                Number of Questions
              </Typography>
              <Slider
                value={questionCount}
                onChange={(e, newValue) => setQuestionCount(newValue)}
                valueLabelDisplay="auto"
                min={5}
                max={20}
                step={5}
                marks
              />
            </Box>

            {/* AI Generation Option */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                />
              }
              label="Use AI to generate unique questions"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={
                generating ||
                !selectedVerticals.length ||
                !selectedRoles.length ||
                !selectedTopics.length
              }
            >
              {generating ? <CircularProgress size={24} /> : 'Generate Practice Test'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default PracticeTestBuilder;
