import { useState } from 'react';
import { Box, Typography, Container, Paper, Button, CircularProgress, IconButton, Divider } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useOptimizeProfileMutation } from './linkedInOptimizerApi.js';

export const LinkedInOptimizerPage = () => {
  const [optimize, { isLoading }] = useOptimizeProfileMutation();
  const [profileData, setProfileData] = useState(null);

  const handleOptimize = async () => {
    try {
      const response = await optimize().unwrap();
      setProfileData(response.data);
    } catch (err) {
      alert('Failed to optimize profile. Ensure your resume is uploaded.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Ideally a snackbar here, but alert is fine for mockup
  };

  return (
    <Container maxWidth="md" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          LinkedIn Profile Optimizer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          Generate an SEO-optimized LinkedIn profile tailored for recruiters instantly.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleOptimize}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
          sx={{ px: 6, py: 1.5, borderRadius: 8, fontSize: '1.1rem' }}
        >
          {isLoading ? 'Optimizing Profile...' : 'Optimize My Profile'}
        </Button>
      </Box>

      {profileData && !isLoading && (
        <Paper sx={{ overflow: 'hidden', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Banner */}
          <Box sx={{ height: 160, background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }} />
          
          <Box sx={{ p: 4, position: 'relative' }}>
            {/* Avatar Mock */}
            <Box sx={{ 
              width: 120, height: 120, borderRadius: '50%', background: '#1e293b', 
              border: '4px solid #0f172a', position: 'absolute', top: -60, left: 32 
            }} />
            
            <Box sx={{ mt: 8 }}>
              {/* Headline */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Your Name</Typography>
                  <Typography variant="body1" sx={{ mt: 1, fontSize: '1.1rem', color: '#cbd5e1' }}>
                    {profileData.headline}
                  </Typography>
                </Box>
                <IconButton onClick={() => copyToClipboard(profileData.headline)} color="primary">
                  <ContentCopyIcon />
                </IconButton>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 4 }} />

              {/* About Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>About</Typography>
                  <IconButton onClick={() => copyToClipboard(profileData.summary)} color="primary" size="small">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#94a3b8', lineHeight: 1.8 }}>
                  {profileData.summary}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 4 }} />

              {/* Experience Section */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Experience</Typography>
                {profileData.experienceBullets.map((exp, i) => (
                  <Box key={i} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{exp.role}</Typography>
                        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{exp.company}</Typography>
                      </Box>
                      <IconButton onClick={() => copyToClipboard(exp.bullets.join('\n'))} color="primary" size="small">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <ul style={{ paddingLeft: 20, color: '#94a3b8', margin: 0 }}>
                      {exp.bullets.map((bullet, j) => (
                        <li key={j} style={{ marginBottom: '8px', lineHeight: 1.6 }}>
                          <Typography variant="body2">{bullet}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Container>
  );
};
