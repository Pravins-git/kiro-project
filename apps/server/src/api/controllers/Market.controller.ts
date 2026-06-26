import { Request, Response, NextFunction } from 'express';
import { MarketIntelligenceService } from '../services/MarketIntelligence.service.js';

const marketService = new MarketIntelligenceService();

export class MarketController {
  static async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as string;
      if (!role) {
        res.status(400).json({ message: 'Role parameter is required' });
        return;
      }

      const insights = await marketService.getMarketInsights(role);
      res.status(200).json({ data: insights });
    } catch (error) {
      next(error);
    }
  }
}
