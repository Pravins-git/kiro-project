import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Avatar, CircularProgress, Chip, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useStartSessionMutation, useSendMessageMutation } from './interviewApi.js';

export const InterviewSimulatorPage = () => {
  const [roleInput, setRoleInput] = useState('');
  const [session, setSession] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const [startSession, { isLoading: isStarting }] = useStartSessionMutation();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (roleInput.trim()) {
      try {
        const response = await startSession({ role: roleInput }).unwrap();
        setSession(response.data);
      } catch (err) {
        alert('Failed to start session');
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (currentMessage.trim() && session) {
      const msg = currentMessage;
      setCurrentMessage('');
      try {
        const response = await sendMessage({ sessionId: session._id, message: msg }).unwrap();
        setSession(response.data);
      } catch (err) {
        alert('Failed to send message');
      }
    }
  };

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ pt: 16, pb: 8, minHeight: '100vh' }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            Behavioral Interview Simulator
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
            Practice your interviewing skills with a rigorous AI interviewer that grades your responses using the STAR method.
          </Typography>
          
          <form onSubmit={handleStart}>
            <TextField
              fullWidth
              label="Target Role"
              placeholder="e.g. Senior Software Engineer"
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
              disabled={isStarting || !roleInput.trim()}
              startIcon={isStarting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            >
              Start Interview
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  const isCompleted = session.status === 'completed';
  const visibleMessages = session.messages.filter(m => m.role !== 'system');

  return (
    <Container maxWidth="md" sx={{ pt: 12, pb: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Interview: {session.role}
        </Typography>
        <Chip 
          label={isCompleted ? "Completed" : "In Progress"} 
          color={isCompleted ? "success" : "primary"} 
          icon={isCompleted ? <CheckCircleIcon /> : <CircularProgress size={16} color="inherit" />}
        />
      </Box>

      {isCompleted && session.feedback && (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#10b981' }}>Report Card: {session.feedback.starScore}/100</Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>{session.feedback.overallFeedback}</Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#34d399', fontWeight: 'bold', mb: 1 }}>Strengths</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {session.feedback.strengths.map((s, i) => <li key={i}><Typography variant="body2">{s}</Typography></li>)}
              </ul>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#f87171', fontWeight: 'bold', mb: 1 }}>Areas to Improve</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {session.feedback.improvements.map((s, i) => <li key={i}><Typography variant="body2">{s}</Typography></li>)}
              </ul>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper sx={{ flex: 1, p: 3, mb: 3, overflowY: 'auto', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {visibleMessages.map((msg, idx) => (
          <Box key={idx} sx={{ display: 'flex', mb: 3, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>AI</Avatar>
            )}
            <Box sx={{ 
              maxWidth: '75%', 
              p: 2, 
              borderRadius: 3, 
              bgcolor: msg.role === 'user' ? 'primary.dark' : 'rgba(255,255,255,0.05)',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
              borderBottomLeftRadius: msg.role === 'ai' ? 4 : 12,
            }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
            </Box>
            {msg.role === 'user' && (
              <Avatar sx={{ bgcolor: 'secondary.main', ml: 2 }}>U</Avatar>
            )}
          </Box>
        ))}
        {isSending && (
          <Box sx={{ display: 'flex', mb: 3, justifyContent: 'flex-start' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>AI</Avatar>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <CircularProgress size={20} />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      <form onSubmit={handleSend}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder="Type your response using the STAR method..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            disabled={isCompleted || isSending}
            sx={{ 
              bgcolor: 'rgba(30, 41, 59, 0.7)', 
              borderRadius: 2,
              '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isCompleted || isSending || !currentMessage.trim()}
            sx={{ px: 4, borderRadius: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </form>
    </Container>
  );
};
