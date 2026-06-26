import { Router } from 'express';
import { CoverLetterController } from '../../api/controllers/CoverLetter.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const coverLetterRouter = Router();

// Protect cover letter routes
coverLetterRouter.use(authSelector as any);

coverLetterRouter.post('/generate', CoverLetterController.generate as any);
