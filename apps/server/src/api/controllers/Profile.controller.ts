import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/Profile.service.js';

export class ProfileController {
  static async getProfile(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, next: NextFunction) {
    try {
      // req.user is set by auth middleware
      const userId = (req as any).user.userId;
      const result = await ProfileService.getProfile(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const result = await ProfileService.updateProfile(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
