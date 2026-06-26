import { Request, Response, NextFunction } from 'express';
import { CoverLetterService } from '../services/CoverLetter.service.js';

const coverLetterService = new CoverLetterService();

export class CoverLetterController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { jobDescription, tone } = req.body;

      if (!jobDescription) {
        res.status(400).json({ message: 'Job Description is required' });
        return;
      }

      const result = await coverLetterService.generateCoverLetter(userId, { jobDescription, tone: tone || 'Professional' });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
