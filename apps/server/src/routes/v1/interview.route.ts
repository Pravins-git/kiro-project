import { Router } from 'express';
import { InterviewController } from '../../api/controllers/Interview.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const interviewRouter = Router();

// Protect interview routes
interviewRouter.use(authSelector as any);

interviewRouter.post('/start', InterviewController.startSession as any);
interviewRouter.post('/:sessionId/message', InterviewController.sendMessage as any);
