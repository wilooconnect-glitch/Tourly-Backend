import { makeExecutableSchema } from '@graphql-tools/schema';
import { gql } from 'apollo-server-express';
import { addressMutations } from './address/address.mutations';
import { addressQueries } from './address/address.queries';
import { addressTypes } from './address/address.types';
import { branchMutations } from './branch/branch.mutations';
import { branchQueries } from './branch/branch.queries';
import { branchResolvers } from './branch/branch.resolvers';
import { branchTypes } from './branch/branch.types';
import { clientMutations } from './clients/client.mutations';
import { clientQueries } from './clients/client.queries';
import { clientResolvers } from './clients/client.resolvers';
import { clientTypes } from './clients/client.types';
import { commonMutations } from './common/common.mutations';
import { commonQueries } from './common/common.queries';
import { commonTypes } from './common/common.types';
import { franchiseeMutations } from './franchisee/franchisee.mutations';
import { franchiseeQueries } from './franchisee/franchisee.queries';
import { franchiseeTypes } from './franchisee/franchisee.types';
import { globalTypes } from './global/global.types';
import { inviteMutations } from './invites/invite.mutations';
import { inviteQueries } from './invites/invite.queries';
import { inviteTypes } from './invites/invite.types';
import { jobMutations } from './jobs/job.mutations';
import { jobQueries } from './jobs/job.queries';
import { jobResolvers } from './jobs/job.resolvers';
import { jobTypes } from './jobs/job.types';
import { messageMutations } from './message/mutations';
import { messageQueries } from './message/queries';
import { messageSubscriptions } from './message/subscriptions';
import { messageTypes } from './message/types';
import { userMutations } from './user/user.mutations';
import { userQueries } from './user/user.queries';
import { userTypes } from './user/user.types';

const baseTypeDefs = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
    createRole(input: RoleInput!): RoleResponse!
  }

  type Subscription {
    _: Boolean
  }
`;

const resolvers = {
  Client: {
    ...clientResolvers,
  },
  Job: {
    ...jobResolvers,
  },
  Branch: {
    ...branchResolvers,
  },
  Query: {
    ...messageQueries,
    ...inviteQueries,
    ...userQueries,
    ...franchiseeQueries,
    ...branchQueries,
    ...clientQueries,
    ...jobQueries,
    ...addressQueries,
    ...commonQueries,
  },
  Mutation: {
    ...messageMutations,
    ...inviteMutations,
    ...userMutations,
    ...franchiseeMutations,
    ...branchMutations,
    ...clientMutations,
    ...jobMutations,
    ...addressMutations,
    ...commonMutations,
  },
  Subscription: {
    ...messageSubscriptions,
  },
};

export const schema = makeExecutableSchema({
  typeDefs: [
    baseTypeDefs,
    userTypes,
    messageTypes,
    inviteTypes,
    franchiseeTypes,
    branchTypes,
    clientTypes,
    jobTypes,
    addressTypes,
    globalTypes,
    commonTypes,
  ],
  resolvers,
});
