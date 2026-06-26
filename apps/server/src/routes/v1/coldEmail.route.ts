import { Router } from 'express';
import { ColdEmailController } from '../../api/controllers/ColdEmail.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const coldEmailRouter = Router();

coldEmailRouter.use(authSelector as any);

coldEmailRouter.post('/generate', ColdEmailController.generate as any);
