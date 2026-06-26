import { Router } from 'express';
import { CareerPivotController } from '../../api/controllers/CareerPivot.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const careerPivotRouter = Router();

careerPivotRouter.use(authSelector as any);

careerPivotRouter.post('/analyze', CareerPivotController.analyze as any);
