import { RegisterRequest, LoginRequest } from '@ai-career/shared';
import { Request, Response, NextFunction } from 'express';

import { AuthService } from '../services/Auth.service.js';

export class AuthController {
  static async register(req: Request<Record<string, never>, Record<string, never>, RegisterRequest>, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request<Record<string, never>, Record<string, never>, LoginRequest>, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  static async googleLogin(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.googleLogin(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, _next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyEmail(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, _next: NextFunction) {
    try {
      const result = await AuthService.verifyEmail(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async enableMfa(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, _next: NextFunction) {
    try {
      const result = await AuthService.enableMfa(req.body.userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyMfa(req: Request<Record<string, never>, Record<string, never>, any>, res: Response, _next: NextFunction) {
    try {
      const result = await AuthService.verifyMfa(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
