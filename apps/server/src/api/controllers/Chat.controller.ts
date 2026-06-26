import { Request, Response, NextFunction } from 'express';

import { ChatService } from '../services/Chat.service.js';

const chatService = new ChatService();

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { message, sessionId } = req.body;
    if (!message) {
      res.status(400).json({ message: 'Message content is required' });
      return;
    }

    const response = await chatService.processMessage(userId, message, sessionId);
    res.status(200).json({ data: response });
  } catch (error) {
    next(error);
  }
};
