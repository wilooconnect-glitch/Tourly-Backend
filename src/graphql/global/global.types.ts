import { gql } from 'apollo-server-express';

export const globalTypes = gql`
  enum AddressType {
    Home
    Work
    Billing
    None
  }

  type Map {
    latitude: Float!
    longitude: Float!
  }

  type Address {
    addressId: ID!
    addressLine: String!
    city: String!
    region: String!
    postalCode: String!
    country: String!
    map: Map!
    isPrimary: Boolean!
    type: AddressType!
    createdAt: String!
    updatedAt: String!
  }

  input MapInput {
    latitude: Float!
    longitude: Float!
  }

  input AddressInput {
    addressLine: String!
    city: String!
    region: String!
    postalCode: String!
    country: String!
    map: MapInput!
    isPrimary: Boolean
    type: AddressType
  }
`;
