import { Router } from 'express';
import { NegotiationController } from '../../api/controllers/Negotiation.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const negotiationRouter = Router();

negotiationRouter.use(authSelector as any);

negotiationRouter.post('/start', NegotiationController.startSession as any);
negotiationRouter.post('/:sessionId/message', NegotiationController.sendMessage as any);
