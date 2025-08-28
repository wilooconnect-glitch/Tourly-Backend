import { IClient } from '@/types/types';
import { Document } from 'mongoose';
export interface Context {
  isAuthenticated: boolean;
}

export interface CreateClientInput {
  branchId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  altPhone?: string;
  companyName?: string;
  adSource?: string;
  allowBilling: boolean;
  taxExempt: boolean;
  addresses: {
    addressLine: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    map: {
      latitude: number;
      longitude: number;
    };
    isPrimary: boolean;
    type: string;
  }[];
}

export interface ListClientsArgs {
  page?: number;
  limit?: number;
  search?: string;
  franchiseeId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
}

export interface ListClientsResult {
  success: boolean;
  message: string;
  clients: IClient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetClientByIdArgs {
  clientId: string;
}

export interface GetClientByIdResult {
  success: boolean;
  message: string;
  client: IClient | null;
}

export interface GetClientByClientNumberArgs {
  clientNumber: number;
}

export interface GetClientByClientNumberResult {
  success: boolean;
  message: string;
  client: IClient | null;
}

export interface CreateClientResponse {
  success: boolean;
  message: string;
  client: IClient;
}

export interface UpdateClientResponse {
  success: boolean;
  message: string;
  client: IClient;
}

export interface DeleteClientResponse {
  success: boolean;
  message: string;
}

export interface UpdateClientArgs {
  clientId: string;
  input: UpdateClientInput;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  companyName?: string;
  adSource?: string;
  allowBilling?: boolean;
  taxExempt?: boolean;
  addressIds?: string[];
  tags?: string[];
  clientNumber?: number;
}

export interface DeleteClientArgs {
  id: string;
}

export interface IClientByBranchArgs {
  branchId: string;
  filters?: Partial<IClient>;
  page?: number;
  limit?: number;
}

export interface IClientByBranchResponse {
  success: boolean;
  message: string;
  clients: IClient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientDocument extends IClient, Document {}

export interface GetAllClientsStatsArgs {
  page?: number;
  limit?: number;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  clientsWithBilling: number;
  taxExemptClients: number;
  clientsBySource: {
    source: string;
    count: number;
  }[];
  clientsByRegion: {
    region: string;
    count: number;
  }[];
}

export interface GetAllClientsStatsResult {
  success: boolean;
  message: string;
  stats: ClientStats;
}
