import { Request, Response, NextFunction } from 'express';
import { CareerPivotService } from '../services/CareerPivot.service.js';

const careerPivotService = new CareerPivotService();

export class CareerPivotController {
  static async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { targetRole } = req.body;

      if (!targetRole) {
        res.status(400).json({ message: 'Target Role is required' });
        return;
      }

      const result = await careerPivotService.analyzePivot(userId, targetRole);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
