import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  LinearProgress,
} from '@mui/material';
import axios from '../utils/axios';

const AdminQuestionManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    prompt: '',
    choices: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 5,
    category: '',
    subcategory: '',
  });
  const [file, setFile] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFormChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleChoiceChange = (index) => (event) => {
    const newChoices = [...formData.choices];
    newChoices[index] = event.target.value;
    setFormData({ ...formData, choices: newChoices });
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post('/api/exam/questions', formData);
      setFormData({
        prompt: '',
        choices: ['', '', '', ''],
        correctAnswer: '',
        difficulty: 5,
        category: '',
        subcategory: '',
      });
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const questions = JSON.parse(e.target.result);
        await axios.post('/api/exam/questions/bulk', questions);
        setFile(null);
        setSuccess(true);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to upload questions');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Question Management
        </Typography>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Manual Entry" />
            <Tab label="Bulk Upload" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Paper sx={{ p: 3, position: 'relative' }}>
            {loading && (
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
              }}>
                <LinearProgress />
              </Box>
            )}
            {error && (
              <Box sx={{ mb: 2 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            {success && (
              <Box sx={{ mb: 2 }}>
                <Typography color="success.main">
                  {tabValue === 0 ? 'Question added successfully!' : 'Questions uploaded successfully!'}
                </Typography>
              </Box>
            )}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Question"
                    value={formData.prompt}
                    onChange={handleFormChange('prompt')}
                    required
                  />
                </Grid>

                {formData.choices.map((choice, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <TextField
                      fullWidth
                      label={`Choice ${index + 1}`}
                      value={choice}
                      onChange={handleChoiceChange(index)}
                      required
                    />
                  </Grid>
                ))}

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={formData.correctAnswer}
                      onChange={handleFormChange('correctAnswer')}
                    >
                      {formData.choices.map((choice, index) => (
                        <MenuItem key={index} value={choice}>
                          {choice || `Choice ${index + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Difficulty (1-10)"
                    value={formData.difficulty}
                    onChange={handleFormChange('difficulty')}
                    inputProps={{ min: 1, max: 10 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    value={formData.category}
                    onChange={handleFormChange('category')}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subcategory"
                    value={formData.subcategory}
                    onChange={handleFormChange('subcategory')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    Add Question
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleFileUpload}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1" gutterBottom>
                    Upload a JSON file containing an array of questions. Each question should have:
                    prompt, choices, correctAnswer, difficulty, category, and optional subcategory.
                  </Typography>
                  <Button
                    component="a"
                    href="/sample-questions.json"
                    download
                    variant="text"
                    color="primary"
                    sx={{ mt: 1 }}
                  >
                    Download Sample Questions Format
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <input
                    accept=".json"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="question-file"
                  />
                  <label htmlFor="question-file">
                    <Button variant="outlined" component="span">
                      Choose File
                    </Button>
                  </label>
                  {file && <Typography sx={{ ml: 2 }}>{file.name}</Typography>}
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!file}
                  >
                    Upload Questions
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default AdminQuestionManager;
