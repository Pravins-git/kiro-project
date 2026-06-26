import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/Assessment.service.js';

const assessmentService = new AssessmentService();

export class AssessmentController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, difficulty } = req.body;
      if (!role) {
        res.status(400).json({ message: 'Role is required' });
        return;
      }

      const question = await assessmentService.generateQuestion(role, difficulty || 'intermediate');
      res.status(200).json({ data: question });
    } catch (error) {
      next(error);
    }
  }

  static async evaluate(req: Request, res: Response, next: NextFunction) {
    try {
      const { questionTitle, questionDescription, answer } = req.body;
      if (!questionTitle || !questionDescription || !answer) {
        res.status(400).json({ message: 'Question details and answer are required' });
        return;
      }

      const evaluation = await assessmentService.evaluateAnswer(questionTitle, questionDescription, answer);
      res.status(200).json({ data: evaluation });
    } catch (error) {
      next(error);
    }
  }
}
