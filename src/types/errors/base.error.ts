import { config } from '@/config/app.config';

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  DATABASE = 'DATABASE_ERROR',
  BUSINESS = 'BUSINESS_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS_ERROR',
}

export interface ErrorMetadata {
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export class BaseError extends Error {
  public readonly type: ErrorType;
  public readonly status: number;
  public readonly isOperational: boolean;
  public readonly metadata: ErrorMetadata | undefined;
  public readonly timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    status: number = 500,
    isOperational: boolean = true,
    metadata?: ErrorMetadata
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.status = status;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      message: this.message,
      status: this.status,
      ...(this.metadata && { metadata: this.metadata }),
      ...(config.app.environment === 'development' && {
        stack: this.stack,
        isOperational: this.isOperational,
      }),
    };
  }
}
