import { Router } from 'express';
import { OfferComparisonController } from '../../api/controllers/OfferComparison.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const offerComparisonRouter = Router();

offerComparisonRouter.use(authSelector as any);

offerComparisonRouter.post('/compare', OfferComparisonController.compare as any);
