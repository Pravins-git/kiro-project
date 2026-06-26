import { Box, Typography, Container, Grid, Paper, Chip, CircularProgress, Button, LinearProgress, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { useNavigate } from 'react-router-dom';
import { useGetCareerMatchesQuery } from './careerApi.js';

export const CareerMatchesPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetCareerMatchesQuery();

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h5" sx={{ mt: 4, color: 'text.secondary' }}>
          Running matching algorithm...
        </Typography>
      </Container>
    );
  }

  if (error || !data?.data?.top5) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>Matching Failed</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {error?.data?.message || 'We could not generate your career matches. Make sure you have uploaded a resume.'}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const matches = data.data.top5;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/chat')}
          sx={{ color: 'text.secondary' }}
        >
          Back to Chat
        </Button>
      </Box>

      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Your Perfect Matches
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6, maxWidth: 800 }}>
        Based on your resume and behavioral profile, here are the career paths where you have the highest probability of success and satisfaction.
      </Typography>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={4}>
          {matches.map((match, idx) => (
            <Grid item xs={12} key={match.careerId || idx}>
              <motion.div variants={itemVariants}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    borderRadius: 4, 
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: idx === 0 ? 'primary.main' : 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {idx === 0 && (
                    <Box sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'primary.main', color: 'white', px: 3, py: 0.5, borderBottomLeftRadius: 16 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>TOP MATCH</Typography>
                    </Box>
                  )}

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.2)', color: 'primary.main', width: 56, height: 56 }}>
                          <WorkIcon fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{match.title}</Typography>
                          <Typography variant="subtitle1" color="primary.main">{match.category}</Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmojiObjectsIcon fontSize="small" /> Why it&apos;s a match
                        </Typography>
                        {match.evidence?.map((ev, i) => (
                          <Typography key={i} variant="body2" sx={{ ml: 3, mb: 0.5, display: 'list-item', color: 'text.secondary' }}>
                            {ev.description}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 3, borderLeft: { md: '1px solid rgba(255,255,255,0.1)' }, pl: { md: 4 } }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Overall Fit Score</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>{match.fitScore?.total}%</Typography>
                          <LinearProgress variant="determinate" value={match.fitScore?.total} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoneyIcon fontSize="small" /> Median Salary
                        </Typography>
                        <Typography variant="h6">{match.salaryRange?.currency} {match.salaryRange?.median?.toLocaleString()}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon fontSize="small" /> Market Demand
                        </Typography>
                        <Chip 
                          label={match.marketDemand?.trend.toUpperCase()} 
                          color={match.marketDemand?.trend === 'rising' ? 'success' : 'primary'}
                          size="small"
                          sx={{ mt: 0.5, fontWeight: 'bold' }}
                        />
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        sx={{ mt: 'auto' }}
                        onClick={() => navigate(`/roadmap/${match.careerId}`, { state: { title: match.title } })}
                      >
                        View Learning Roadmap
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
};


