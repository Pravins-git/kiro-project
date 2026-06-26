import { Request, Response, NextFunction } from 'express';
import { NetworkService } from '../services/Network.service.js';

const networkService = new NetworkService();

export class NetworkController {
  static async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as string;
      if (!role) {
        res.status(400).json({ message: 'Role parameter is required' });
        return;
      }

      const recommendations = await networkService.getRecommendations(role);
      res.status(200).json({ data: recommendations });
    } catch (error) {
      next(error);
    }
  }
}
