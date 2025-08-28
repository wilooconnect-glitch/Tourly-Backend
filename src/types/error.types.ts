export interface GraphQLError extends Error {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}
