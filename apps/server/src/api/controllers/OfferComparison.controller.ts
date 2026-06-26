import { Request, Response, NextFunction } from 'express';
import { OfferComparisonService } from '../services/OfferComparison.service.js';

const offerComparisonService = new OfferComparisonService();

export class OfferComparisonController {
  static async compare(req: Request, res: Response, next: NextFunction) {
    try {
      const { offers } = req.body;

      if (!offers || !Array.isArray(offers) || offers.length < 2) {
        res.status(400).json({ message: 'At least two offers are required for comparison' });
        return;
      }

      const result = await offerComparisonService.compareOffers(offers);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
