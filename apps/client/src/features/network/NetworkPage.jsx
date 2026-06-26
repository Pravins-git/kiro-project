import { useState } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid, CircularProgress, Chip, Card, CardContent, Divider, Link } from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import BusinessIcon from '@mui/icons-material/Business';
import GitHubIcon from '@mui/icons-material/GitHub';
import StrategyIcon from '@mui/icons-material/Lightbulb';

import { useLazyGetNetworkRecommendationsQuery } from './networkApi.js';

export const NetworkPage = () => {
  const [roleInput, setRoleInput] = useState('');
  const [getRecommendations, { data: response, isFetching }] = useLazyGetNetworkRecommendationsQuery();

  const handleGenerate = (e) => {
    e.preventDefault();
    if (roleInput.trim()) {
      getRecommendations(roleInput);
    }
  };

  const recommendations = response?.data;

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Network & Connections
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Discover the top companies to target, foundational open-source projects to contribute to, and highly actionable networking strategies for your desired role.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 6, borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <form onSubmit={handleGenerate}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter your target role (e.g. Machine Learning Engineer)"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              sx={{ '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isFetching || !roleInput.trim()}
              startIcon={isFetching ? <CircularProgress size={20} color="inherit" /> : <HubIcon />}
              sx={{ px: 4, whiteSpace: 'nowrap', borderRadius: 2 }}
            >
              Analyze
            </Button>
          </Box>
        </form>
      </Paper>

      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {recommendations && !isFetching && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 'bold' }}>
                <BusinessIcon color="primary" /> Top Target Companies
              </Typography>
              <Grid container spacing={2}>
                {recommendations.targetCompanies.map((c, i) => (
                  <Grid item xs={12} key={i}>
                    <Card sx={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" color="primary.light" sx={{ fontWeight: 'bold' }}>{c.name}</Typography>
                        <Typography variant="body2" sx={{ my: 1 }}>{c.description}</Typography>
                        <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 'bold' }}>Why Target: {c.whyTarget}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 'bold' }}>
                <GitHubIcon color="secondary" /> Open Source Projects
              </Typography>
              <Grid container spacing={2}>
                {recommendations.openSourceProjects.map((p, i) => (
                  <Grid item xs={12} key={i}>
                    <Card sx={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" color="secondary.light" sx={{ fontWeight: 'bold' }}>{p.name}</Typography>
                        <Link href={p.url} target="_blank" variant="body2" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>{p.url}</Link>
                        <Chip label={p.contributionType} size="small" variant="outlined" color="info" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 'bold' }}>
                <StrategyIcon color="warning" /> Networking Strategy
              </Typography>
              <Paper sx={{ p: 3, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {recommendations.networkingStrategy.map((s, i) => (
                    <li key={i} style={{ marginBottom: '12px' }}>
                      <Typography variant="body1">{s}</Typography>
                    </li>
                  ))}
                </ul>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};
