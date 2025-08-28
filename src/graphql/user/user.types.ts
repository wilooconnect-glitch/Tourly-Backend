import { gql } from 'apollo-server-express';

export interface IUpdateUserArgs {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface Context {
  isAuthenticated: boolean;
}

export interface IMockToken {
  success: boolean;
  newToken: string | null;
}

export const userTypes = gql`
  type User {
    _id: ID!
    firstName: String
    lastName: String
    username: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input UpdateUserInput {
    username: String
    email: String
    firstName: String
    lastName: String
  }

  type UpdateUserPayload {
    success: Boolean!
    user: User!
  }

  type MockTokenResponse {
    success: Boolean
    newToken: String
  }

  extend type Query {
    me: User
    users: [User!]!
    getMockAuthToken(userId: String!): MockTokenResponse
  }

  extend type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateUser(id: ID!, input: UpdateUserInput): UpdateUserPayload
    resetPassword(id: String!, newPassword: String!): UpdateUserPayload
  }
`;
