import {
  Context,
  GetAllClientsStatsArgs,
  GetAllClientsStatsResult,
  GetClientByClientNumberArgs,
  GetClientByClientNumberResult,
  GetClientByIdArgs,
  GetClientByIdResult,
  ListClientsArgs,
  ListClientsResult,
} from '@/graphql/clients/client.interfaces';
import { FilterQuery } from 'mongoose';
import { createError } from '../../middleware/errorHandler';
import { Address } from '../../models/Address';
import { Client } from '../../models/Client';
import { Job } from '../../models/Job';
import { BaseError } from '../../types/errors/base.error';
import { IClient } from '../../types/types';

export const clientQueries = {
  listClients: async (
    _: unknown,
    args: ListClientsArgs,
    { isAuthenticated }: Context
  ): Promise<ListClientsResult> => {
    if (!isAuthenticated) throw createError.authentication('Not authenticated');
    try {
      const {
        page = 1,
        limit = 10,
        search,
        firstName,
        lastName,
        phone,
        companyName,
      } = args;

      const filters: FilterQuery<IClient> = {};

      if (search) {
        // First, search for addresses that match the search term
        const addressIds = await Address.find({
          $or: [
            { addressLine: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { region: { $regex: search, $options: 'i' } },
            { postalCode: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } },
          ],
        }).distinct('addressId');

        // Create search filter that includes both client fields and address matches
        filters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ];

        // Add clientNumber search if the search term is numeric
        const numericSearch = parseInt(search);
        if (!isNaN(numericSearch)) {
          filters.$or.push({ clientNumber: numericSearch });
        }

        // If addresses match the search, add them to the OR condition
        if (addressIds.length > 0) {
          filters.$or.push({ addressIds: { $in: addressIds } });
        }
      }

      if (firstName) filters.firstName = { $regex: firstName, $options: 'i' };
      if (lastName) filters.lastName = { $regex: lastName, $options: 'i' };
      if (phone) filters.phone = phone;
      if (companyName)
        filters.companyName = { $regex: companyName, $options: 'i' };

      const skip = (page - 1) * limit;
      const [clients, total] = await Promise.all([
        Client.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Client.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Clients fetched successfully.',
        clients,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to list clients', {
        operation: 'list',
        entityType: 'Client',
      });
    }
  },
  listClientsByFranchisee: async (
    _: unknown,
    args: ListClientsArgs,
    { isAuthenticated }: Context
  ): Promise<ListClientsResult> => {
    if (!isAuthenticated) throw createError.authentication('Not authenticated');

    try {
      const {
        page = 1,
        limit = 10,
        search,
        franchiseeId,
        firstName,
        lastName,
        phone,
        companyName,
      } = args;

      const filters: FilterQuery<IClient> = {
        franchiseeId,
      };
      if (search) {
        filters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];

        // Add clientNumber search if the search term is numeric
        const numericSearch = parseInt(search);
        if (!isNaN(numericSearch)) {
          filters.$or.push({ clientNumber: numericSearch });
        }
      }

      if (firstName) filters.firstName = { $regex: firstName, $options: 'i' };
      if (lastName) filters.lastName = { $regex: lastName, $options: 'i' };
      if (phone) filters.phone = phone;
      if (companyName)
        filters.companyName = { $regex: companyName, $options: 'i' };

      const skip = (page - 1) * limit;
      const [clients, total] = await Promise.all([
        Client.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Client.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Clients fetched successfully.',
        clients,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to list clients', {
        operation: 'list',
        entityType: 'Client',
      });
    }
  },
  getClientById: async (
    _: unknown,
    args: GetClientByIdArgs,
    { isAuthenticated }: Context
  ): Promise<GetClientByIdResult> => {
    if (!isAuthenticated) throw createError.authentication('Not authenticated');
    try {
      const client = await Client.findOne({ clientId: args.clientId });
      if (!client) {
        return {
          success: false,
          message: 'Client not found.',
          client: null,
        };
      }

      return {
        success: true,
        message: 'Client fetched successfully.',
        client,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to get client by ID', {
        operation: 'get',
        entityType: 'Client',
      });
    }
  },
  getClientByClientNumber: async (
    _: unknown,
    args: GetClientByClientNumberArgs,
    { isAuthenticated }: Context
  ): Promise<GetClientByClientNumberResult> => {
    if (!isAuthenticated) throw createError.authentication('Not authenticated');

    try {
      const client = await Client.findOne({ clientNumber: args.clientNumber });
      if (!client) {
        return {
          success: false,
          message: 'Client not found.',
          client: null,
        };
      }
      return {
        success: true,
        message: 'Client fetched successfully.',
        client,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to get client by client number', {
        operation: 'get',
        entityType: 'Client',
      });
    }
  },
  getAllClientsStats: async (
    _: unknown,
    args: GetAllClientsStatsArgs,
    { isAuthenticated }: Context
  ): Promise<GetAllClientsStatsResult> => {
    try {
      if (!isAuthenticated)
        throw createError.authentication('Not authenticated');

      // Get total number of clients
      const totalClients = await Client.countDocuments();

      // Get counts for billing and tax exempt clients
      const [clientsWithBilling, taxExemptClients] = await Promise.all([
        Client.countDocuments({ allowBilling: true }),
        Client.countDocuments({ taxExempt: true }),
      ]);

      // Get clients by ad source
      const clientsBySource = await Client.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$adSource', 'Unknown'] },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            source: '$_id',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Get clients by region
      const clientsByRegion = await Client.aggregate([
        { $unwind: '$addresses' },
        {
          $group: {
            _id: '$addresses.region',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            region: '$_id',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Calculate active clients (those with jobs in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeClientsCount = await Job.distinct('clientId', {
        createdAt: { $gte: thirtyDaysAgo },
      }).then(clientIds => clientIds.length);

      const stats = {
        totalClients,
        activeClients: activeClientsCount,
        clientsWithBilling,
        taxExemptClients,
        clientsBySource,
        clientsByRegion,
      };

      return {
        success: true,
        message: 'All clients stats fetched successfully.',
        stats,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to get all clients stats', {
        operation: 'get',
        entityType: 'Client',
      });
    }
  },
  listClientsByBranch: async (
    _: unknown,
    args: ListClientsArgs & { branchId: string },
    { isAuthenticated }: Context
  ): Promise<ListClientsResult> => {
    if (!isAuthenticated) throw createError.authentication('Not authenticated');

    try {
      const {
        page = 1,
        limit = 10,
        search,
        branchId,
        firstName,
        lastName,
        phone,
        companyName,
      } = args;

      const filters: FilterQuery<IClient> = { branchId };

      if (search) {
        // First, search for addresses that match the search term
        const addressIds = await Address.find({
          $or: [
            { addressLine: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { region: { $regex: search, $options: 'i' } },
            { postalCode: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } },
          ],
        }).distinct('addressId');

        // Create search filter that includes both client fields and address matches
        filters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ];

        // Add clientNumber search if the search term is numeric
        const numericSearch = parseInt(search);
        if (!isNaN(numericSearch)) {
          filters.$or.push({ clientNumber: numericSearch });
        }

        // If addresses match the search, add them to the OR condition
        if (addressIds.length > 0) {
          filters.$or.push({ addressIds: { $in: addressIds } });
        }
      }

      if (firstName) filters.firstName = { $regex: firstName, $options: 'i' };
      if (lastName) filters.lastName = { $regex: lastName, $options: 'i' };
      if (phone) filters.phone = phone;
      if (companyName)
        filters.companyName = { $regex: companyName, $options: 'i' };

      const skip = (page - 1) * limit;
      const [clients, total] = await Promise.all([
        Client.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Client.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Clients fetched successfully.',
        clients,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to fetch clients by branch', {
        operation: 'get',
        entityType: 'Client',
      });
    }
  },
};
