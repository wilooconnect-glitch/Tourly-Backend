import { ErrorMetadata } from './base.error';
import {
  AuthenticationError,
  AuthorizationError,
  BusinessError,
  DatabaseError,
  ExternalServiceError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  ValidationError,
} from './specific.error';

export class ErrorFactory {
  static validation(
    message: string,
    metadata?: ErrorMetadata
  ): ValidationError {
    return new ValidationError(message, metadata);
  }

  static authentication(
    message: string,
    metadata?: ErrorMetadata
  ): AuthenticationError {
    return new AuthenticationError(message, metadata);
  }

  static authorization(
    message: string,
    metadata?: ErrorMetadata
  ): AuthorizationError {
    return new AuthorizationError(message, metadata);
  }

  static notFound(message: string, metadata?: ErrorMetadata): NotFoundError {
    return new NotFoundError(message, metadata);
  }

  static database(message: string, metadata?: ErrorMetadata): DatabaseError {
    return new DatabaseError(message, metadata);
  }

  static business(message: string, metadata?: ErrorMetadata): BusinessError {
    return new BusinessError(message, metadata);
  }

  static externalService(
    message: string,
    metadata?: ErrorMetadata
  ): ExternalServiceError {
    return new ExternalServiceError(message, metadata);
  }

  static internal(message: string, metadata?: ErrorMetadata): InternalError {
    return new InternalError(message, metadata);
  }

  // Helper method for validation errors with field information
  static fieldValidation(field: string, message: string): ValidationError {
    return new ValidationError(message, { field });
  }

  // Helper method for database errors with operation information
  static databaseOperation(operation: string, message: string): DatabaseError {
    return new DatabaseError(message, { operation });
  }

  // Helper method for external service errors with service information
  static externalServiceCall(
    service: string,
    message: string
  ): ExternalServiceError {
    return new ExternalServiceError(message, { service });
  }

  static tooManyRequests(
    message: string,
    metadata?: ErrorMetadata
  ): TooManyRequestsError {
    return new TooManyRequestsError(message, metadata);
  }
}
