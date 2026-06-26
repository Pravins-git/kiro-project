import { Router } from 'express';
import { NetworkController } from '../../api/controllers/Network.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const networkRouter = Router();

// Protect network routes
networkRouter.use(authSelector as any);

networkRouter.get('/recommendations', NetworkController.getRecommendations as any);
