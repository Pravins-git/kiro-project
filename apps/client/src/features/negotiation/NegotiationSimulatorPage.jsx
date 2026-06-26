import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Avatar, CircularProgress, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useStartSessionMutation, useSendMessageMutation } from './negotiationApi.js';

export const NegotiationSimulatorPage = () => {
  const [targetRole, setTargetRole] = useState('');
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
    if (targetRole.trim()) {
      try {
        const response = await startSession({ targetRole }).unwrap();
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
            Salary Negotiation Simulator
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
            Practice negotiating with a strict AI HR recruiter. See how much you can bump up your initial offer!
          </Typography>
          
          <form onSubmit={handleStart}>
            <TextField
              fullWidth
              label="Target Role"
              placeholder="e.g. Senior Product Manager"
              variant="outlined"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isStarting || !targetRole.trim()}
              startIcon={isStarting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            >
              Start Negotiation
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  const isCompleted = session.status === 'completed';
  const visibleMessages = session.messages.filter(m => m.role !== 'system');
  const bumpedAmount = session.currentOffer - session.initialOffer;

  return (
    <Container maxWidth="md" sx={{ pt: 12, pb: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            HR Chat: {session.targetRole}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon fontSize="small" />
            Current Offer: ${session.currentOffer.toLocaleString()} 
            {bumpedAmount > 0 && ` (+$${bumpedAmount.toLocaleString()})`}
          </Typography>
        </Box>
        <Chip 
          label={isCompleted ? "Accepted" : "Negotiating"} 
          color={isCompleted ? "success" : "primary"} 
          icon={isCompleted ? <CheckCircleIcon /> : <CircularProgress size={16} color="inherit" />}
        />
      </Box>

      <Paper sx={{ flex: 1, p: 3, mb: 3, overflowY: 'auto', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {visibleMessages.map((msg, idx) => (
          <Box key={idx} sx={{ display: 'flex', mb: 3, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <Avatar sx={{ bgcolor: 'secondary.dark', mr: 2 }}>HR</Avatar>
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
              <Avatar sx={{ bgcolor: 'primary.main', ml: 2 }}>U</Avatar>
            )}
          </Box>
        ))}
        {isSending && (
          <Box sx={{ display: 'flex', mb: 3, justifyContent: 'flex-start' }}>
            <Avatar sx={{ bgcolor: 'secondary.dark', mr: 2 }}>HR</Avatar>
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
            placeholder="Type your counter-offer or justification..."
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
