import { Request, Response, NextFunction } from 'express';
import { LinkedInOptimizerService } from '../services/LinkedInOptimizer.service.js';

const linkedInOptimizerService = new LinkedInOptimizerService();

export class LinkedInOptimizerController {
  static async optimize(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      const result = await linkedInOptimizerService.optimizeProfile(userId);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
