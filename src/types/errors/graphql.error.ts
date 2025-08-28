import { GraphQLError as ApolloGraphQLError } from 'graphql';
import { BaseError } from './base.error';

export function formatGraphQLError(error: unknown): ApolloGraphQLError {
  if (error instanceof BaseError) {
    return new ApolloGraphQLError(error.message, {
      extensions: {
        code: error.type,
        status: error.status,
        metadata: error.metadata,
      },
    });
  }

  if (error instanceof ApolloGraphQLError) {
    return error;
  }

  const baseError = error instanceof Error ? error : new Error(String(error));
  return new ApolloGraphQLError(baseError.message, {
    extensions: {
      code: 'INTERNAL_ERROR',
      status: 500,
    },
  });
}
