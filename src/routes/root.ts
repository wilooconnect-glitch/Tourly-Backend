import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config/app.config';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const appInfo = {
      name: config.app.name,
      version: config.app.version,
      environment: config.app.environment,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    logger.info('Root route accessed', {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'SND CRM Backend API is running',
      data: appInfo,
    });
  } catch (error) {
    logger.error('Error in root route', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        config.app.environment === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
});

export { router as rootRoutes };
