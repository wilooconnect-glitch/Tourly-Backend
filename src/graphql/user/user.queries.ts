import { createError } from '@/middleware/errorHandler';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config/app.config';
import { BaseError } from '../../types/errors/base.error';
import { IMockToken } from './user.types';

export const userQueries = {
  getMockAuthToken: async (
    _: unknown,
    args: { userId: string }
  ): Promise<IMockToken> => {
    try {
      const options = { expiresIn: '30m' } as SignOptions;
      const newToken = jwt.sign(
        { userId: args.userId },
        config.jwt.accessSecret as jwt.Secret,
        options
      );

      return {
        success: true,
        newToken,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to get mock token', {
        operation: 'get',
        entityType: 'User',
      });
    }
  },
};
