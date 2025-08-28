import crypto from 'crypto';

export const generateTempPassword = (length = 12): string => {
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length);
};
