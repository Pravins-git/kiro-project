import { Request, Response, NextFunction } from 'express';
import { InterviewService } from '../services/Interview.service.js';

const interviewService = new InterviewService();

export class InterviewController {
  static async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { role } = req.body;
      
      if (!role) {
        res.status(400).json({ message: 'Role is required to start an interview' });
        return;
      }

      const session = await interviewService.startSession(userId, role);
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

      const session = await interviewService.processMessage(sessionId, userId, message);
      res.status(200).json({ data: session });
    } catch (error) {
      next(error);
    }
  }
}
