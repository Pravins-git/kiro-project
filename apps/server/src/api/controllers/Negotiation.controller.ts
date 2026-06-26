import { Request, Response, NextFunction } from 'express';
import { NegotiationService } from '../services/Negotiation.service.js';

const negotiationService = new NegotiationService();

export class NegotiationController {
  static async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { targetRole } = req.body;
      
      if (!targetRole) {
        res.status(400).json({ message: 'Target Role is required to start a negotiation' });
        return;
      }

      const session = await negotiationService.startSession(userId, targetRole);
      res.status(201).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ message: 'Message content is required' });
        return;
      }

      const session = await negotiationService.processMessage(sessionId, userId, message);
      res.status(200).json({ data: session });
    } catch (error) {
      next(error);
    }
  }
}
