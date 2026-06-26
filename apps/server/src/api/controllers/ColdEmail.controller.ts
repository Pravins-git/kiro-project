import { Request, Response, NextFunction } from 'express';
import { ColdEmailService } from '../services/ColdEmail.service.js';

const coldEmailService = new ColdEmailService();

export class ColdEmailController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { targetCompany, jobDescription } = req.body;

      if (!targetCompany || !jobDescription) {
        res.status(400).json({ message: 'Target Company and Job Description are required' });
        return;
      }

      const result = await coldEmailService.generateSequence(userId, targetCompany, jobDescription);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
