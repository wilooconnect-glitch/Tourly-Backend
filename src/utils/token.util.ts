import jwt, { SignOptions } from 'jsonwebtoken';
import { IInviteTokenPayload } from '@/types/types';
import { config } from '@/config/app.config';

/**
 * Generate JWT token for invite
 * @param payload Object containing email and orgId
 * @param expiresIn Token expiration, e.g. '30m'
 */

export const generateInviteToken = (
  payload: IInviteTokenPayload,
  expiresIn: string
): string => {
  const options = { expiresIn } as SignOptions;
  return jwt.sign(payload, config.jwt.accessSecret as jwt.Secret, options);
};

export const verifyInviteToken = (token: string): IInviteTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as IInviteTokenPayload;
};
