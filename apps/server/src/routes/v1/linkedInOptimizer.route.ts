import { Router } from 'express';
import { LinkedInOptimizerController } from '../../api/controllers/LinkedInOptimizer.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const linkedInOptimizerRouter = Router();

linkedInOptimizerRouter.use(authSelector as any);

linkedInOptimizerRouter.post('/optimize', LinkedInOptimizerController.optimize as any);
