import { useState } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid, CircularProgress, Card, CardContent, IconButton, Chip } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { useGenerateSequenceMutation } from './coldEmailApi.js';

export const ColdEmailPage = () => {
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generate, { isLoading }] = useGenerateSequenceMutation();
  const [sequence, setSequence] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (targetCompany.trim() && jobDescription.trim()) {
      try {
        const response = await generate({ targetCompany, jobDescription }).unwrap();
        setSequence(response.data);
      } catch (err) {
        alert('Failed to generate email sequence. Ensure your resume is uploaded.');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Cold Email Campaign Generator
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Generate highly tailored initial outreach and follow-up emails targeting hiring managers.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ flex: 1 }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <form onSubmit={handleGenerate}>
              <TextField
                fullWidth
                label="Target Company"
                placeholder="e.g. Acme Corp"
                variant="outlined"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Job Description"
                placeholder="Paste the target job description here..."
                variant="outlined"
                multiline
                rows={12}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading || !targetCompany.trim() || !jobDescription.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
              >
                Generate Sequence
              </Button>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          {sequence ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Initial Email */}
              <Card sx={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip label="Step 1: Initial Outreach" color="primary" />
                    <IconButton onClick={() => copyToClipboard(`Subject: ${sequence.initialOutreach.subject}\n\n${sequence.initialOutreach.body}`)} color="primary">
                      <ContentCopyIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#38bdf8' }}>
                    Subject: {sequence.initialOutreach.subject}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {sequence.initialOutreach.body}
                  </Typography>
                </CardContent>
              </Card>

              {/* Follow Up */}
              <Card sx={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip label="Step 2: Follow Up (3-5 days later)" color="success" />
                    <IconButton onClick={() => copyToClipboard(`Subject: ${sequence.followUp.subject}\n\n${sequence.followUp.body}`)} color="success">
                      <ContentCopyIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#34d399' }}>
                    Subject: {sequence.followUp.subject}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {sequence.followUp.body}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: 'rgba(30, 41, 59, 0.3)', border: '1px dashed rgba(255,255,255,0.2)' }}>
              <MailOutlineIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.1)', mb: 3 }} />
              <Typography variant="h6" color="text.secondary">
                Your highly tailored email sequence will appear here.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
