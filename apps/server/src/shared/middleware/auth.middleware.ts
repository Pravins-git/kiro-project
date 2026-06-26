import { UserRole } from '@ai-career/shared';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../../config/index.js';
import { cognitoService } from '../../api/services/aws/Cognito.service.js';
import { logger } from '../logger.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: UserRole };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Cognito-based authentication middleware.
 * Validates Cognito access tokens via CognitoService.getUser().
 * Sets req.user with sub as userId and defaults role to 'student'.
 */
export const authenticateCognito = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const accessToken = authHeader.split(' ')[1];
    const userInfo = await cognitoService.getUser(accessToken);

    req.user = {
      userId: userInfo.sub,
      role: 'student' as UserRole, // Default role for Cognito users
    };
    next();
  } catch (error: any) {
    logger.warn({ error: error.message }, 'Cognito authentication failed');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Auth selector middleware — picks the right auth strategy based on config.useCognito.
 * When USE_COGNITO=true, uses Cognito token validation.
 * Otherwise, uses the existing JWT-based authenticate middleware.
 */
export const authSelector = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (config.useCognito) {
    return authenticateCognito(req, res, next);
  }
  return authenticate(req, res, next);
};

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};
