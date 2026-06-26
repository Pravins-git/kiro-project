import { Request, Response, NextFunction } from 'express';

import { config } from '../../config/index.js';
import { logger } from '../logger.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

/**
 * In-memory rate limiter middleware (per-IP, configurable limits).
 * 
 * Note: This is an in-memory store and is NOT suitable for multi-instance deployments.
 * For production, use a Redis-backed rate limiter or AWS WAF rate limiting.
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const maxRequests = options.maxRequests || config.rateLimit.maxRequests;
  const message = options.message || 'Too many requests, please try again later.';
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const skip = options.skip || (() => false);

  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, windowMs);

  // Don't prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip(req)) {
      next();
      return;
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      // Create new window
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetAt / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      logger.warn({ key, count: entry.count, maxRequests }, 'Rate limit exceeded');

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Default key generator — uses IP address.
 */
function defaultKeyGenerator(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Create a stricter rate limiter for auth endpoints.
 */
export function authRateLimiter() {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 min
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    skip: (req) => req.path === '/health',
  });
}

/**
 * Create a rate limiter for AI-heavy endpoints.
 */
export function aiRateLimiter() {
  return rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 AI calls per minute
    message: 'AI request rate limit exceeded. Please wait before making another request.',
  });
}
