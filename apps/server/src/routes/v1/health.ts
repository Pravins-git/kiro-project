import { Router, Request, Response } from 'express';

import { config } from '../../config/index.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.version,
    environment: config.nodeEnv,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
