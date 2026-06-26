import { Router } from 'express';
import { AssessmentController } from '../../api/controllers/Assessment.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const assessmentRouter = Router();

assessmentRouter.use(authSelector as any);

assessmentRouter.post('/generate', AssessmentController.generate as any);
assessmentRouter.post('/evaluate', AssessmentController.evaluate as any);
