import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Container, TextField, IconButton, Paper, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { motion } from 'framer-motion';
import { useSendMessageMutation } from './chatApi.js';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components';

export const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Career Mentor. Let's dig deeper into your career goals, preferences, and leadership style to find your perfect match. What's the most exciting project you've worked on recently?",
    }
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendMessage({ message: input, sessionId }).unwrap();
      const { message, sessionId: newSessionId } = response.data;
      
      if (!sessionId) {
        setSessionId(newSessionId);
      }
      
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Let's try again later." }
      ]);
    }
  };

  return (
    <Container maxWidth="md" sx={{ pt: 12, pb: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>AI Career Mentor</Typography>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/career-matches')}
          disabled={messages.length < 3}
        >
          View Career Matches
        </Button>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '12px'
              }}
            >
              {msg.role === 'assistant' && (
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon />
                </Avatar>
              )}
              
              <Box
                sx={{
                  maxWidth: '75%',
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: msg.role === 'user' ? 'primary.main' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                  borderTopLeftRadius: msg.role === 'assistant' ? 4 : 12,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Box>

              {msg.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <PersonIcon />
                </Avatar>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><SmartToyIcon /></Avatar>
                <Typography variant="body2" color="text.secondary">Typing...</Typography>
              </Box>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box component="form" onSubmit={handleSend} sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Type your response..."
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'primary.main' },
              }
            }}
          />
          <IconButton 
            color="primary" 
            type="submit" 
            disabled={!input.trim() || isLoading}
            sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};
