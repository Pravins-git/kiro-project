import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Paper, CircularProgress, Button, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGenerateRoadmapMutation, useGetRoadmapQuery } from './roadmapApi.js';

export const LearningRoadmapPage = () => {
  const { careerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [generateRoadmap, { isLoading: isGenerating }] = useGenerateRoadmapMutation();
  const { data: roadmapData, isLoading: isFetching, refetch } = useGetRoadmapQuery(careerId, {
    skip: !careerId
  });

  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    const fetchOrGenerate = async () => {
      // First, see if we already fetched it
      if (roadmapData?.data) {
        setRoadmap(roadmapData.data);
        return;
      }

      if (!isFetching && !roadmapData?.data && location.state?.title) {
        try {
          const res = await generateRoadmap({ 
            targetCareerId: careerId, 
            targetCareerTitle: location.state.title 
          }).unwrap();
          setRoadmap(res.data);
          refetch(); // Ensure query cache updates
        } catch (err) {
          console.error("Failed to generate roadmap", err);
        }
      }
    };

    fetchOrGenerate();
  }, [careerId, location.state, roadmapData, isFetching, generateRoadmap, refetch]);

  if (isGenerating || isFetching) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h5" sx={{ mt: 4, color: 'text.secondary' }}>
          Generating your custom learning roadmap...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Our AI is mapping your current skills to the {location.state?.title || 'target'} role.
        </Typography>
      </Container>
    );
  }

  if (!roadmap) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh', textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>Failed to load roadmap</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/career-matches')}>
          Back to Matches
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/career-matches')}
        sx={{ mb: 4, color: 'text.secondary' }}
      >
        Back to Matches
      </Button>

      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Your Path to {roadmap.targetCareerTitle}
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6, maxWidth: 800 }}>
        Estimated completion: {roadmap.estimatedCompletionDate} • {roadmap.timeCommitmentHoursPerWeek} hours / week
      </Typography>

      <Box sx={{ maxWidth: 800 }}>
        <Stepper orientation="vertical" sx={{ 
          '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.1)' }
        }}>
          {roadmap.weeks.map((week, index) => (
            <Step key={index} active={true} expanded={true}>
              <StepLabel 
                StepIconComponent={() => (
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    {week.weekNumber}
                  </Box>
                )}
              >
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Week {week.weekNumber}: {week.focus}
                </Typography>
              </StepLabel>
              <StepContent>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    my: 2,
                    borderRadius: 3, 
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Typography variant="subtitle1" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>Activities</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    {week.activities.map((activity, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PlayArrowIcon fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
                        <Typography variant="body1" color="text.secondary">{activity}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {week.milestone && (
                    <>
                      <Typography variant="subtitle1" sx={{ color: '#4ade80', fontWeight: 'bold' }} gutterBottom>Milestone Goal</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 2, bgcolor: 'rgba(74, 222, 128, 0.1)', borderRadius: 2, border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: '#4ade80', mt: 0.2 }} />
                        <Typography variant="body2" sx={{ color: '#bbf7d0' }}>{week.milestone}</Typography>
                      </Box>
                    </>
                  )}
                </Paper>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Container>
  );
};
