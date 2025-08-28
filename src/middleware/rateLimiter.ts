import { config } from '@/config/app.config';
import { getRedisClient } from '@/config/redis';
import { NextFunction, Request, Response } from 'express';
import { createError } from './errorHandler';

const WINDOW_MS = config.rateLimit.windowMs;
const MAX_REQUESTS = config.rateLimit.max;

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `rate_limit:${req.ip}`;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, WINDOW_MS / 1000);
    }

    if (current > MAX_REQUESTS) {
      const error = createError.tooManyRequests('Too many requests');
      return next(error);
    }

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + WINDOW_MS).toISOString()
    );

    next();
  } catch (error) {
    // If Redis is unavailable, continue without rate limiting
    next();
  }
}
