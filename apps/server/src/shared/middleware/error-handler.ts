import { Request, Response, NextFunction } from 'express';

import { config } from '../../config/index.js';
import { AppError } from '../errors.js';
import { logger } from '../logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    logger.warn(
      { err, requestId, statusCode: err.statusCode },
      'Application error',
    );
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(config.nodeEnv === 'development' && { stack: err.stack }),
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
    requestId,
    timestamp: new Date().toISOString(),
  });
}
