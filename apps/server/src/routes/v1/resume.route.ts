import { Router } from 'express';

import { upload, uploadResume, getResumeAnalysis } from '../../api/controllers/Resume.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

export const resumeRouter = Router();

// Protect all resume routes
resumeRouter.use(authenticate as any);

resumeRouter.post('/upload', upload.single('resume'), uploadResume);
resumeRouter.get('/:id', getResumeAnalysis);
