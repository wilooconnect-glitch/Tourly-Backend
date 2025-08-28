import { makeExecutableSchema } from '@graphql-tools/schema';
import { gql } from 'apollo-server-express';
import { globalTypes } from './global/global.types';
import { userTypes } from './user/user.types';
import { userQueries } from './user/user.queries';
import { userMutations } from './user/user.mutations';

const baseTypeDefs = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

const resolvers = {
  Query: {
    ...userQueries,
  },
  Mutation: {
    ...userMutations,
  },
};

export const schema = makeExecutableSchema({
  typeDefs: [
    baseTypeDefs,
    userTypes,
    globalTypes,
  ],
  resolvers,
});
