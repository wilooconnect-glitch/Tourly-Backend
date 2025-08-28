import { gql } from 'apollo-server-express';

export const clientTypes = gql`
  type Client {
    clientId: ID!
    clientNumber: Int
    branchId: ID!
    firstName: String!
    lastName: String
    email: String!
    phone: String!
    altPhone: String
    companyName: String
    adSource: String
    allowBilling: Boolean!
    taxExempt: Boolean!
    addressIds: [String!]!
    addresses: [Address!]!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type ClientAddress {
    addressLine: String
    city: String
    region: String
    postalCode: String
    country: String
    map: ClientMap
  }

  type ClientMap {
    latitude: Float
    longitude: Float
  }

  input InputClientAddress {
    addressLine: String
    city: String
    region: String
    postalCode: String
    country: String
    map: InputClientMap
  }

  input InputClientMap {
    latitude: Float
    longitude: Float
  }

  type CreateClientResp {
    success: Boolean!
    message: String!
    client: Client
  }

  input CreateClientInput {
    branchId: ID!
    firstName: String!
    lastName: String!
    email: String!
    phone: String!
    altPhone: String
    companyName: String
    adSource: String
    allowBilling: Boolean!
    taxExempt: Boolean!
    addresses: [InputClientAddress!]!
  }

  input UpdateClientInput {
    firstName: String
    lastName: String
    email: String
    phone: String
    altPhone: String
    companyName: String
    adSource: String
    allowBilling: Boolean
    taxExempt: Boolean
    addressIds: [String!]
    tags: [String!]
    clientNumber: Int
  }

  type UpdateClientResp {
    success: Boolean!
    message: String!
    client: Client
  }

  type DeleteClientResp {
    success: Boolean!
    message: String!
  }

  type SeedClientsResult {
    success: Boolean!
    count: Int!
    clients: [Client!]!
  }

  type ClientListResp {
    success: Boolean!
    message: String!
    clients: [Client]
    total: Int!
    page: Int!
    limit: Int
  }

  type GetClientByIdResp {
    success: Boolean!
    message: String
    client: Client
  }

  type GetClientByClientNumberResp {
    success: Boolean!
    message: String
    client: Client
  }

  input ClientFilterInput {
    firstName: String
    lastName: String
    email: String
    phone: String
    altPhone: String
    companyName: String
    adSource: String
    allowBilling: Boolean
    taxExempt: Boolean
    clientNumber: Int
  }

  type PaginatedClients {
    success: Boolean!
    clients: [Client!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type ClientStatsBySource {
    source: String!
    count: Int!
  }

  type ClientStatsByRegion {
    region: String!
    count: Int!
  }

  type ClientStats {
    totalClients: Int!
    activeClients: Int!
    clientsWithBilling: Int!
    taxExemptClients: Int!
    clientsBySource: [ClientStatsBySource!]!
    clientsByRegion: [ClientStatsByRegion!]!
  }

  type GetAllClientsStatsResp {
    success: Boolean!
    message: String!
    stats: ClientStats!
  }

  extend type Query {
    listClients(
      page: Int = 1
      limit: Int = 10
      search: String
      firstName: String
      lastName: String
      phone: String
      companyName: String
    ): ClientListResp!
    getClientById(clientId: ID!): GetClientByIdResp!
    getClientByClientNumber(clientNumber: Int!): GetClientByClientNumberResp!
    listClientsByBranch(
      branchId: ID!
      page: Int = 1
      limit: Int = 10
      search: String
      firstName: String
      lastName: String
      phone: String
      companyName: String
    ): PaginatedClients!
    getAllClientsStats: GetAllClientsStatsResp!
    listClientsByFranchisee(
      franchiseeId: ID!
      filters: ClientFilterInput
      page: Int = 1
      limit: Int = 10
    ): PaginatedClients!
  }

  extend type Mutation {
    createClient(input: CreateClientInput!): CreateClientResp
    updateClient(clientId: ID!, input: UpdateClientInput!): UpdateClientResp
    deleteClient(clientId: ID!): DeleteClientResp
    seedClients(branchId: ID!): SeedClientsResult!
  }
`;
