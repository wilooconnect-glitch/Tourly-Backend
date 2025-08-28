import { BaseError, ErrorType } from '@/types/errors/base.error';
import { ErrorFactory } from '@/types/errors/error.factory';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

// Re-export error factory for convenience
export { ErrorFactory as createError };

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Defensive checks
  if (!error) {
    next();
    return;
  }

  if (!res || typeof res?.status !== 'function') {
    next(error);
    return;
  }

  let normalizedError: BaseError;

  // Normalize different error types into our BaseError format
  if (error instanceof BaseError) {
    normalizedError = error;
  } else if (error instanceof Error) {
    // Convert standard Error instances
    normalizedError = new BaseError(
      error.message || 'Internal Server Error',
      ErrorType.INTERNAL,
      500,
      false,
      { originalError: error.name }
    );
  } else if (typeof error === 'string') {
    // Convert string errors
    normalizedError = new BaseError(error, ErrorType.INTERNAL);
  } else {
    // Handle unknown error types
    normalizedError = new BaseError(
      'An unexpected error occurred',
      ErrorType.INTERNAL,
      500,
      false,
      { originalError: error }
    );
  }

  // Log the error with enhanced context
  logger.error('Request error:', {
    type: normalizedError.type,
    status: normalizedError.status,
    message: normalizedError.message,
    isOperational: normalizedError.isOperational,
    metadata: normalizedError.metadata,
    url: req.url,
    method: req.method,
    requestId: req.headers['x-request-id'],
    userId: (req as Request).user?.id,
    timestamp: normalizedError.timestamp,
    stack: normalizedError.stack,
  });

  // Send error response
  try {
    res.status(normalizedError.status).json({
      success: false,
      error: normalizedError.toJSON(),
    });
  } catch (responseError) {
    logger.error('Error sending error response:', responseError);
    // Attempt to send a basic error response
    res.status(500).json({
      success: false,
      error: {
        message: 'Error while sending error response',
        type: ErrorType.INTERNAL,
        status: 500,
      },
    });
  }
}
