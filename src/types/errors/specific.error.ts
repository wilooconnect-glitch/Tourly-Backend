import { BaseError, ErrorMetadata, ErrorType } from './base.error';

export class ValidationError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.VALIDATION, 400, true, metadata);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.AUTHENTICATION, 401, true, metadata);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.AUTHORIZATION, 403, true, metadata);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.NOT_FOUND, 404, true, metadata);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.DATABASE, 500, true, metadata);
  }
}

export class BusinessError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.BUSINESS, 422, true, metadata);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.EXTERNAL_SERVICE, 502, true, metadata);
  }
}

export class InternalError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.INTERNAL, 500, false, metadata);
  }
}

export class TooManyRequestsError extends BaseError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorType.TOO_MANY_REQUESTS, 429, true, metadata);
  }
}
