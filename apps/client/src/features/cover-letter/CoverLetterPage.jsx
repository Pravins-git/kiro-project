import { useState } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid, CircularProgress, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useGenerateCoverLetterMutation } from './coverLetterApi.js';

export const CoverLetterPage = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [coverLetter, setCoverLetter] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const [generate, { isLoading }] = useGenerateCoverLetterMutation();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      try {
        const response = await generate({ jobDescription, tone }).unwrap();
        setCoverLetter(response.data.content);
      } catch (err) {
        alert('Failed to generate cover letter. Ensure you have uploaded a resume first.');
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setSnackbarOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        AI Cover Letter Generator
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
        Paste a job description below. We'll cross-reference it with your resume and generate a highly tailored cover letter.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Job Description</Typography>
            <form onSubmit={handleGenerate}>
              <TextField
                fullWidth
                multiline
                rows={12}
                variant="outlined"
                placeholder="Paste the target job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                sx={{ mb: 3, '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }}
              />
              
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Tone</InputLabel>
                <Select
                  value={tone}
                  label="Tone"
                  onChange={(e) => setTone(e.target.value)}
                  sx={{ '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }}
                >
                  <MenuItem value="Professional">Professional & Formal</MenuItem>
                  <MenuItem value="Enthusiastic">Enthusiastic & Passionate</MenuItem>
                  <MenuItem value="Direct">Direct & Concise</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading || !jobDescription.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                {isLoading ? 'Generating...' : 'Generate Cover Letter'}
              </Button>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Generated Letter</Typography>
              <Button 
                variant="outlined" 
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                disabled={!coverLetter}
              >
                Copy
              </Button>
            </Box>
            
            {coverLetter ? (
              <TextField
                fullWidth
                multiline
                variant="standard"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ 
                  flex: 1, 
                  '& textarea': { 
                    lineHeight: 1.8, 
                    color: 'rgba(255,255,255,0.9)', 
                    height: '100% !important',
                    overflowY: 'auto !important'
                  } 
                }}
              />
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary" align="center">
                  Your customized cover letter will appear here.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>Cover letter copied to clipboard!</Alert>
      </Snackbar>
    </Container>
  );
};
