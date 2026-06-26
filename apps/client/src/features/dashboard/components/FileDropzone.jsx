import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useNavigate } from 'react-router-dom';
import { useUploadResumeMutation } from '../../resume/resumeApi.js';

export const FileDropzone = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadResume, { isLoading, error }] = useUploadResumeMutation();
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }
    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await uploadResume(formData).unwrap();
      // Assuming response.data.resumeId is returned
      if (response.data?.resumeId) {
        navigate(`/analysis/${response.data.resumeId}`);
      }
    } catch (err) {
      console.error('Failed to upload resume:', err);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            backgroundColor: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          
          <motion.div
            animate={{ scale: isDragActive ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {file ? (
              <InsertDriveFileIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            ) : (
              <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            )}
          </motion.div>

          <Typography variant="h6" color="text.primary" gutterBottom>
            {file ? file.name : 'Drag & Drop your resume here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supports PDF and DOCX up to 5MB'}
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error?.data?.message || 'Failed to upload file'}
          </Alert>
        )}

        {file && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleAnalyze}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                px: 6, 
                py: 1.5,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
              }}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};
