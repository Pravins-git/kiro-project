import { Request, Response, NextFunction } from 'express';

import { CareerMatchesService } from '../services/CareerMatches.service.js';

const careerService = new CareerMatchesService();

export const getCareerMatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const response = await careerService.generateMatches(userId);
    res.status(200).json({ data: response });
  } catch (error) {
    next(error);
  }
};
