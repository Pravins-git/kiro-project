import { Request, Response, NextFunction } from 'express';

import { config } from '../../config/index.js';
import { logger } from '../logger.js';

/**
 * Optional X-Ray tracing middleware.
 * Only activates when XRAY_ENABLED=true in environment.
 * Instruments Express requests with AWS X-Ray segments.
 */
export function xrayMiddleware() {
  if (!config.xrayEnabled) {
    logger.info('X-Ray tracing is disabled (XRAY_ENABLED != true)');
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  try {
    // Dynamic import of aws-xray-sdk — only loaded when X-Ray is enabled
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AWSXRay = require('aws-xray-sdk');

    // Configure X-Ray
    AWSXRay.setDaemonAddress(process.env.XRAY_DAEMON_ADDRESS || '127.0.0.1:2000');
    AWSXRay.setContextMissingStrategy('LOG_ERROR');

    logger.info('X-Ray tracing enabled and initialized');

    // Return X-Ray Express middleware
    return AWSXRay.express.openSegment('ai-career-platform');
  } catch (error) {
    logger.warn({ error }, 'Failed to initialize X-Ray SDK — tracing disabled. Install aws-xray-sdk if needed.');
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
}

/**
 * X-Ray close segment middleware.
 * Should be placed after all route handlers but before error handlers.
 */
export function xrayCloseSegment() {
  if (!config.xrayEnabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  try {
    const AWSXRay = require('aws-xray-sdk');
    return AWSXRay.express.closeSegment();
  } catch {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
}
