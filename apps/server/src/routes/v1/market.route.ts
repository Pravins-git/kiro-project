import { Router } from 'express';
import { MarketController } from '../../api/controllers/Market.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const marketRouter = Router();

// Protect market routes
marketRouter.use(authSelector as any);

marketRouter.get('/insights', MarketController.getInsights as any);
