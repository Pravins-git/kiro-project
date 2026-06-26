import { Typography, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { FileDropzone } from './components/FileDropzone.jsx';

export const DashboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #fff 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Career Intelligence Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Upload your resume to get AI-powered insights, skill gap analysis, and tailored career recommendations.
        </Typography>
      </motion.div>

      <FileDropzone />
    </Container>
  );
};
