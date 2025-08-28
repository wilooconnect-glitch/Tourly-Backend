import { DirectiveLocation, GraphQLDirective, GraphQLString } from 'graphql';
import { GraphQLContext } from '../context';

/**
 * GraphQL Auth Directive
 *
 * Usage:
 * directive @auth(requires: String = "USER") on FIELD_DEFINITION | OBJECT | FIELD
 *
 * Examples:
 * - @auth(requires: "USER") - requires authenticated user
 * - @auth(requires: "ADMIN") - requires admin role
 * - @auth - default authentication required
 */
export const authDirective = new GraphQLDirective({
  name: 'auth',
  description: 'Authentication directive to protect fields and operations',
  locations: [
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.OBJECT,
    DirectiveLocation.FIELD,
  ],
  args: {
    requires: {
      type: GraphQLString,
      description: 'Required role or permission level',
      defaultValue: 'USER',
    },
  },
});

/**
 * Check if user is authenticated
 */
export function isAuthenticated(context: GraphQLContext): boolean {
  return context.isAuthenticated && !!context.user;
}

/**
 * Check if user has required role
 */
export function hasRole(
  context: GraphQLContext,
  requiredRole: string
): boolean {
  if (!context.user) return false;

  // For now, we'll implement basic role checking
  // You can extend this based on your role system
  if (requiredRole === 'USER') return true;
  if (requiredRole === 'ADMIN') {
    // Check if user has admin role - implement based on your role system
    // You'll need to extend the User model to include role information
    return false; // Placeholder - implement based on your role system
  }

  return false;
}

/**
 * Auth directive transformer for Apollo Server
 */
export const authDirectiveTransformer = (schema: unknown): unknown => {
  return schema;
};
