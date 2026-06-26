import { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, CircularProgress, Chip, Divider, Grid } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import { useGenerateQuestionMutation, useEvaluateAnswerMutation } from './assessmentApi.js';

export const AssessmentPage = () => {
  const [roleInput, setRoleInput] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState(null);

  const [generate, { isLoading: isGenerating }] = useGenerateQuestionMutation();
  const [evaluate, { isLoading: isEvaluating }] = useEvaluateAnswerMutation();

  useEffect(() => {
    let timer;
    if (timeLeft !== null && timeLeft > 0 && !evaluation) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !evaluation) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, evaluation]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (roleInput.trim()) {
      try {
        const response = await generate({ role: roleInput, difficulty }).unwrap();
        setQuestion(response.data);
        setTimeLeft(response.data.timeLimitMinutes * 60);
        setAnswer('');
        setEvaluation(null);
      } catch (err) {
        alert('Failed to generate question');
      }
    }
  };

  const handleSubmit = async () => {
    if (question && answer.trim()) {
      try {
        const response = await evaluate({ 
          questionTitle: question.title, 
          questionDescription: question.description, 
          answer 
        }).unwrap();
        setEvaluation(response.data);
      } catch (err) {
        alert('Failed to evaluate answer');
      }
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!question) {
    return (
      <Container maxWidth="sm" sx={{ pt: 16, pb: 8, minHeight: '100vh' }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            Mock Technical Assessment
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
            Generate a role-specific coding or system design question and be graded by AI.
          </Typography>
          
          <form onSubmit={handleStart}>
            <TextField
              fullWidth
              label="Target Role"
              placeholder="e.g. Backend Developer"
              variant="outlined"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isGenerating || !roleInput.trim()}
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            >
              Generate Assessment
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {question.title}
        </Typography>
        <Chip 
          label={evaluation ? "Completed" : formatTime(timeLeft)} 
          color={evaluation ? "success" : (timeLeft < 300 ? "error" : "primary")} 
          icon={evaluation ? <CheckCircleIcon /> : <TimerIcon />}
          sx={{ fontSize: '1.2rem', p: 2 }}
        />
      </Box>

      <Grid container spacing={4} sx={{ flex: 1 }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Prompt</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {question.description}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          {evaluation ? (
            <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', overflowY: 'auto' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#10b981' }}>Score: {evaluation.score}/100</Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>{evaluation.overallFeedback}</Typography>
              
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#3b82f6' }}>Correctness Feedback</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>{evaluation.correctnessFeedback}</Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#eab308' }}>Efficiency & Optimization</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>{evaluation.efficiencyFeedback}</Typography>
              
              <Button variant="outlined" onClick={() => setQuestion(null)}>Try Another Assessment</Button>
            </Paper>
          ) : (
            <Paper sx={{ p: 0, height: '100%', borderRadius: 4, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="subtitle2" color="text.secondary">Your Solution (Code or Text)</Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                variant="standard"
                placeholder="// Write your solution here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ 
                  flex: 1, 
                  p: 2,
                  '& textarea': { 
                    fontFamily: 'monospace',
                    lineHeight: 1.6, 
                    color: '#d4d4d4', 
                    height: '100% !important',
                    overflowY: 'auto !important'
                  } 
                }}
              />
              <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSubmit}
                  disabled={isEvaluating || !answer.trim()}
                  startIcon={isEvaluating && <CircularProgress size={20} color="inherit" />}
                >
                  Submit Assessment
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
