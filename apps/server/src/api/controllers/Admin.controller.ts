import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/Admin.service.js';

export class AdminController {
  static async getMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await AdminService.getDashboardMetrics();
      res.status(200).json({ data: metrics });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await AdminService.getUsers(page, limit);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, _next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await AdminService.deleteUser(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
