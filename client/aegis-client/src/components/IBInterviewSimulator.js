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
  CircularProgress,
  Alert,
  useTheme,
  LinearProgress,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../utils/axios';

const IBInterviewSimulator = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banks, setBanks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryProgress, setRetryProgress] = useState(0);
  const [retryMessage, setRetryMessage] = useState('');
  const MAX_RETRIES = 3;

  // Form state
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [availableGroups, setAvailableGroups] = useState([]);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    // When bank selection changes, update available groups
    if (selectedBank) {
      const bank = banks.find(b => b._id === selectedBank);
      if (bank) {
        setAvailableGroups(bank.groups);
        setSelectedGroup(''); // Reset group selection
      }
    } else {
      setAvailableGroups([]);
      setSelectedGroup('');
    }
  }, [selectedBank, banks]);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await examAPI.get('/ib-interview/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      setError('Failed to load investment banks. Please try again.');
    } finally {
      setLoading(false);
    }
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
      const testSession = await examAPI.post('/ib-interview/generate', params);
      
      // Clear progress interval
      clearInterval(progressInterval);
      setRetryProgress(100);
      
      // Success - store test session and navigate
      localStorage.setItem('currentPracticeTest', JSON.stringify(testSession.data));
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
      if (!selectedBank || !selectedGroup) {
        setError('Please select both a bank and a group');
        return;
      }

      setGenerating(true);
      setError(null);
      setRetryCount(0);
      setRetryMessage('');

      const params = {
        bankId: selectedBank,
        groupId: selectedGroup,
        count: questionCount,
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

  // Get the selected bank and group details for display
  const selectedBankData = banks.find(b => b._id === selectedBank);
  const selectedGroupData = selectedBankData?.groups.find(g => g._id === selectedGroup);

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Investment Bank Interview Simulator
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Prepare for your investment banking interviews by simulating questions specific to your target bank and group.
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {/* Bank Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Investment Bank</InputLabel>
                <Select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  disabled={generating}
                >
                  {banks.map((bank) => (
                    <MenuItem key={bank._id} value={bank._id}>
                      {bank.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Group Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Group</InputLabel>
                <Select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={!selectedBank || generating}
                >
                  {availableGroups.map((group) => (
                    <MenuItem key={group._id} value={group._id}>
                      {group.name} ({group.fullName})
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
                  disabled={generating}
                >
                  <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                  <MenuItem value="written-answer">Written Answer</MenuItem>
                </Select>
              </FormControl>

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
                  disabled={generating}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* Bank and Group Details */}
              {selectedBankData && selectedGroupData && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedBankData.name} - {selectedGroupData.fullName}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedGroupData.description}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Difficulty Level: {selectedGroupData.difficulty}/10
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Focus Areas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {selectedGroupData.topics.map((topic) => (
                      <Typography key={topic} variant="body2" component="span" sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}>
                        {topic}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>

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
            disabled={generating || !selectedBank || !selectedGroup}
          >
            {generating ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                {retryCount === 0 ? 'Generating Practice Test... This may take a minute' : `Retry ${retryCount}/${MAX_RETRIES} in progress...`}
              </>
            ) : (
              'Generate IB Interview Questions'
            )}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default IBInterviewSimulator;
