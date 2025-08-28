import Redis from 'ioredis';
import { logger } from '@/utils/logger';
import { config } from '@/config/app.config';

let redisClient: Redis;

export async function connectRedis(): Promise<void> {
  try {
    const redisConfig = config.redis;

    redisClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', error => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    // Test the connection
    await redisClient.ping();
    logger.info('Redis connection test successful');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.disconnect();
      logger.info('Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
}
