import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Grid, Paper, Chip, CircularProgress, Button, Divider, Alert, AlertTitle } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import GroupIcon from '@mui/icons-material/Group';
import CodeIcon from '@mui/icons-material/Code';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { useGetResumeAnalysisQuery } from './resumeApi.js';

export const AnalysisResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetResumeAnalysisQuery(id);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h5" sx={{ mt: 4, color: 'text.secondary' }}>
          Deeply analyzing your professional profile...
        </Typography>
      </Container>
    );
  }

  if (error || !data?.data?.analysis) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', textAlign: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" color="error" gutterBottom>
          Analysis Failed
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {error?.data?.message || 'We could not analyze your resume. Please try again.'}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const { analysis } = data.data;

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
          onClick={() => navigate('/dashboard')}
          sx={{ color: 'text.secondary' }}
        >
          Back to Dashboard
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<TrendingFlatIcon />}
          onClick={() => navigate('/chat')}
          sx={{ borderRadius: 8, px: 4 }}
        >
          Continue to Career Matching
        </Button>
      </Box>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Typography 
          variant="h3" 
          component={motion.h1}
          variants={itemVariants}
          sx={{ fontWeight: 800, mb: 2 }}
        >
          Holistic Intelligence Report
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 6, maxWidth: 800 }}>
          {analysis.resumeOverview}
        </Typography>

        {/* SDE Misalignment Alert */}
        {analysis.potentialMisalignmentWithPureSdeRoles?.isMisaligned && (
          <motion.div variants={itemVariants}>
            <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(245, 158, 11, 0.3)', bgcolor: 'rgba(245, 158, 11, 0.05)' }}>
              <AlertTitle sx={{ fontWeight: 'bold' }}>Career Path Realignment Suggested</AlertTitle>
              <Typography variant="body2" gutterBottom>
                <strong>Evidence:</strong> {analysis.potentialMisalignmentWithPureSdeRoles.evidenceBasedFindings}
              </Typography>
              <Typography variant="body2">
                <strong>Analysis:</strong> {analysis.potentialMisalignmentWithPureSdeRoles.explanation}
              </Typography>
            </Alert>
          </motion.div>
        )}

        <Grid container spacing={4}>
          {/* Overall Confidence Score Card */}
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>AI Confidence Score</Typography>
                <Box 
                  sx={{ 
                    width: 120, height: 120, 
                    borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `conic-gradient(#6366f1 ${analysis.overallConfidenceScore}%, transparent 0)`,
                    position: 'relative',
                    mb: 3
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 100, height: 100, borderRadius: '50%', 
                      background: '#1e293b', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{analysis.overallConfidenceScore}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Based on the clarity, depth, and evidence of impact in your resume.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Core Strengths */}
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants} style={{ height: '100%' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  height: '100%'
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Core Strengths Breakdown</Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="primary.main">Technical Ability</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{analysis.coreStrengths?.technicalAbility}</Typography>

                    <Typography variant="subtitle2" color="primary.main">Problem Solving</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{analysis.coreStrengths?.problemSolving}</Typography>
                    
                    <Typography variant="subtitle2" color="primary.main">Innovation</Typography>
                    <Typography variant="body2" color="text.secondary">{analysis.coreStrengths?.innovation}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="primary.main">Leadership</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{analysis.coreStrengths?.leadership}</Typography>

                    <Typography variant="subtitle2" color="primary.main">Communication</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{analysis.coreStrengths?.communication}</Typography>
                    
                    <Typography variant="subtitle2" color="primary.main">Collaboration</Typography>
                    <Typography variant="body2" color="text.secondary">{analysis.coreStrengths?.collaboration}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Personality & Work Style */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Behavioral & Personality Indicators</Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PsychologyIcon color="secondary" /> Observed Traits
                    </Typography>
                    {analysis.personalityIndicators?.map((trait, idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white' }}>{trait.trait} (Confidence: {trait.confidenceScore}%)</Typography>
                        <Typography variant="body2" color="text.secondary">{trait.resumeEvidence}</Typography>
                      </Box>
                    ))}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <GroupIcon color="secondary" /> Work Style Signals
                    </Typography>
                    {analysis.workStyleSignals?.map((signal, idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white' }}>{signal.observation} (Confidence: {signal.confidenceScore}%)</Typography>
                        <Typography variant="body2" color="text.secondary">{signal.resumeEvidence}</Typography>
                      </Box>
                    ))}
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Hard Skills */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon color="primary" /> Extracted Hard Skills
                </Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analysis.hardSkills?.map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={`${skill.skillName} (${skill.proficiencyLevel})`} 
                      variant="outlined"
                      sx={{ 
                        borderColor: '#6366f1', 
                        color: '#c7d2fe',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        px: 1, py: 2, borderRadius: 2
                      }} 
                    />
                  ))}
                </Box>
              </Paper>
            </motion.div>
          </Grid>

        </Grid>
      </motion.div>
    </Container>
  );
};
