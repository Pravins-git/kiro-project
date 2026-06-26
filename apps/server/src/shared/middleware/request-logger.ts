import { Request, Response, NextFunction } from 'express';

import { logger } from '../logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        requestId: req.requestId,
      },
      'Request completed',
    );
  });

  next();
}
