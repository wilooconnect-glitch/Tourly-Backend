import {
  Context,
  CreateClientInput,
  CreateClientResponse,
  UpdateClientArgs,
  UpdateClientResponse,
} from '@/graphql/clients/client.interfaces';
import { createError } from '@/middleware/errorHandler';
import { Client } from '@/models/Client';
import { BaseError } from '@/types/errors/base.error';
import { IClient } from '@/types/types';
import { faker } from '@faker-js/faker';
import { Address } from '../../models/Address';

export const clientMutations = {
  createClient: async (
    _: unknown,
    { input }: { input: CreateClientInput },
    { isAuthenticated }: Context
  ): Promise<CreateClientResponse> => {
    if (!isAuthenticated) {
      throw createError.authentication('Not authenticated');
    }
    const { branchId, phone, addresses, ...rest } = input;
    try {
      // Check uniqueness for branchId + phone + email
      const existingClient = await Client.findOne({
        branchId,
        phone,
      });
      if (existingClient) {
        throw createError.validation(
          'A client with this phone and email already exists for this branch.',
          { field: 'email/phone' }
        );
      }

      // Create addresses & collect UUIDs
      const addressDocs = addresses.map(addr => ({
        addressLine: addr.addressLine,
        city: addr.city,
        region: addr.region,
        postalCode: addr.postalCode,
        country: addr.country,
        map: {
          latitude: addr.map.latitude,
          longitude: addr.map.longitude,
        },
        isPrimary: addr.isPrimary,
        type: addr.type,
      }));
      const insertedAddresses = await Address.insertMany(addressDocs);
      const addressIds = insertedAddresses.map(a => a.addressId);

      const newClient = new Client({
        branchId,
        phone,
        addressIds,
        ...rest,
      });
      await newClient.save();
      return {
        success: true,
        message: 'Client created successfully.',
        client: newClient,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to create client', {
        operation: 'create',
        entityType: 'Client',
        error: error,
      });
    }
  },

  updateClient: async (
    _: unknown,
    { clientId, input }: UpdateClientArgs,
    { isAuthenticated }: Context
  ): Promise<UpdateClientResponse> => {
    if (!isAuthenticated) {
      throw createError.authentication('Not authenticated');
    }

    try {
      // Check if client exists
      const existingClient = await Client.findOne({ clientId });
      if (!existingClient) {
        throw createError.notFound(`Client with ID ${clientId} not found`, {
          entityType: 'Client',
          entityId: clientId,
        });
      }

      // If phone is being updated, check for uniqueness within the same branch
      if (input.phone && input.phone !== existingClient.phone) {
        const phoneExists = await Client.findOne({
          branchId: existingClient.branchId,
          phone: input.phone,
          clientId: { $ne: clientId }, // Exclude current client
        });

        if (phoneExists) {
          throw createError.validation(
            'A client with this phone number already exists in this branch.',
            { field: 'phone' }
          );
        }
      }

      // If clientNumber is being updated, check for uniqueness within the same branch
      if (
        input.clientNumber &&
        input.clientNumber !== existingClient.clientNumber
      ) {
        const clientNumberExists = await Client.findOne({
          branchId: existingClient.branchId,
          clientNumber: input.clientNumber,
          clientId: { $ne: clientId }, // Exclude current client
        });

        if (clientNumberExists) {
          throw createError.validation(
            'A client with this client number already exists in this branch.',
            { field: 'clientNumber' }
          );
        }
      }

      // Prepare update data
      const updateData: Partial<IClient> = {};

      // Only include fields that are provided in the input
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.altPhone !== undefined) updateData.altPhone = input.altPhone;
      if (input.companyName !== undefined)
        updateData.companyName = input.companyName;
      if (input.adSource !== undefined) updateData.adSource = input.adSource;
      if (input.allowBilling !== undefined)
        updateData.allowBilling = input.allowBilling;
      if (input.taxExempt !== undefined) updateData.taxExempt = input.taxExempt;
      if (input.addressIds !== undefined)
        updateData.addressIds = input.addressIds;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.clientNumber !== undefined)
        updateData.clientNumber = input.clientNumber;

      const updatedClient = await Client.findOneAndUpdate(
        { clientId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedClient) {
        throw createError.database('Failed to update client', {
          operation: 'update',
          entityType: 'Client',
          entityId: clientId,
        });
      }

      return {
        success: true,
        message: 'Client updated successfully.',
        client: updatedClient,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to update client', {
        operation: 'update',
        entityType: 'Client',
        entityId: clientId,
        error: error,
      });
    }
  },

  deleteClient: async (
    _: unknown,
    { clientId }: { clientId: string },
    { isAuthenticated }: Context
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!isAuthenticated) {
      throw createError.authentication('Not authenticated');
    }

    try {
      const deletedClient = await Client.findOneAndDelete({ clientId });
      if (!deletedClient) {
        throw createError.notFound(`Client with ID ${clientId} not found`, {
          entityType: 'Client',
          entityId: clientId,
        });
      }

      return {
        success: true,
        message: 'Client deleted successfully',
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to delete client', {
        operation: 'delete',
        entityType: 'Client',
        entityId: clientId,
        error: error,
      });
    }
  },

  seedClients: async (
    _: unknown,
    args: { branchId: string },
    { isAuthenticated }: Context
  ): Promise<{ success: boolean; count: number; clients: IClient[] }> => {
    if (!isAuthenticated) {
      throw createError.authentication('Not authenticated');
    }

    const { branchId } = args;
    try {
      const clients: IClient[] = [];

      for (let i = 0; i < 20; i++) {
        const addressDocs = [
          {
            addressLine: faker.location.streetAddress(),
            city: faker.location.city(),
            region: faker.location.state(),
            postalCode: faker.location.zipCode(),
            country: faker.location.country(),
            map: {
              latitude: faker.location.latitude(),
              longitude: faker.location.longitude(),
            },
            isPrimary: false,
            type: 'Home',
          },
        ];
        const insertedAddresses = await Address.insertMany(addressDocs);
        const addressIds = insertedAddresses.map(a => a.addressId);

        const clientData = {
          branchId,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.string.numeric(10),
          altPhone: faker.string.numeric(10),
          companyName: faker.company.name(),
          adSource: faker.company.buzzPhrase(),
          allowBilling: faker.datatype.boolean(),
          taxExempt: faker.datatype.boolean(),
          addressIds,
        };

        const newClient = await Client.create(clientData);
        clients.push(newClient);
      }

      return {
        success: true,
        count: clients.length,
        clients,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to seed clients', {
        operation: 'seed',
        entityType: 'Client',
        count: 20,
        error: error,
      });
    }
  },
};
