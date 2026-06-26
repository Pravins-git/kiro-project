import { useState } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid, CircularProgress, LinearProgress, Card, CardContent } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useAnalyzePivotMutation } from './careerPivotApi.js';

export const CareerPivotPage = () => {
  const [targetRole, setTargetRole] = useState('');
  const [analyze, { isLoading }] = useAnalyzePivotMutation();
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (targetRole.trim()) {
      try {
        const response = await analyze({ targetRole }).unwrap();
        setAnalysis(response.data);
      } catch (err) {
        alert('Failed to analyze pivot. Ensure your resume is uploaded.');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Career Pivot Analyzer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Input a completely new career path and discover your transferable skills and critical gaps instantly.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 6, borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <form onSubmit={handleAnalyze}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="e.g. Product Manager (from Software Engineer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              sx={{ '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !targetRole.trim()}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SwapHorizIcon />}
              sx={{ px: 4, whiteSpace: 'nowrap', borderRadius: 2 }}
            >
              Analyze Pivot
            </Button>
          </Box>
        </form>
      </Paper>

      {analysis && !isLoading && (
        <Box>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Pivot Feasibility Score</Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={120} sx={{ color: 'rgba(255,255,255,0.1)', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={analysis.pivotFeasibilityScore} size={120} sx={{ color: analysis.pivotFeasibilityScore > 60 ? '#10b981' : '#f59e0b' }} />
              <Typography variant="h4" sx={{ position: 'absolute', fontWeight: 'bold' }}>{analysis.pivotFeasibilityScore}</Typography>
            </Box>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 'bold', color: '#34d399' }}>
                <CheckCircleOutlineIcon /> Transferable Skills
              </Typography>
              <Grid container spacing={2}>
                {analysis.transferableSkills.map((s, i) => (
                  <Grid item xs={12} key={i}>
                    <Card sx={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{s.skill}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10b981' }}>{s.matchScore}% Match</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={s.matchScore} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                        <Typography variant="body2">{s.reasoning}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 'bold', color: '#f87171' }}>
                <ErrorOutlineIcon /> Critical Gaps
              </Typography>
              <Grid container spacing={2}>
                {analysis.criticalGaps.map((g, i) => (
                  <Grid item xs={12} key={i}>
                    <Card sx={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{g.skill}</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>{g.reasoning}</Typography>
                        <Box sx={{ p: 1.5, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ color: '#fca5a5', fontWeight: 'bold', display: 'block', mb: 0.5 }}>Suggested Action:</Typography>
                          <Typography variant="body2">{g.suggestedAction}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};
