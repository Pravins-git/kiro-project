import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from './config/index.js';
import { v1Router } from './routes/v1/index.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { notFoundHandler } from './shared/middleware/not-found.js';
import { rateLimiter } from './shared/middleware/rate-limit.js';
import { requestId } from './shared/middleware/request-id.js';
import { requestLogger } from './shared/middleware/request-logger.js';
import { xrayMiddleware, xrayCloseSegment } from './shared/middleware/xray.middleware.js';

export function createApp(): express.Application {
  const app = express();

  // X-Ray tracing (must be first — opens segment for each request)
  app.use(xrayMiddleware());

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Global rate limiter (after body parsing, before routes)
  app.use(rateLimiter());

  // Request tracking
  app.use(requestId);
  app.use(requestLogger);

  // Health check (root level)
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: config.version,
      environment: config.nodeEnv,
    });
  });

  // API routes
  app.use('/v1', v1Router);

  // X-Ray close segment (after routes, before error handlers)
  app.use(xrayCloseSegment());

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
