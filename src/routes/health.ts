import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database = 'connected';
    } else {
      healthCheck.services.database = 'disconnected';
    }

    // Check Redis connection
    try {
      const redis = getRedisClient();
      await redis.ping();
      healthCheck.services.redis = 'connected';
    } catch (error) {
      healthCheck.services.redis = 'disconnected';
      logger.error('Redis health check failed:', error);
    }

    const allServicesHealthy =
      healthCheck.services.database === 'connected' &&
      healthCheck.services.redis === 'connected';

    const statusCode = allServicesHealthy ? 200 : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    healthCheck.message = 'ERROR';
    res.status(503).json(healthCheck);
  }
});

export { router as healthCheck };
