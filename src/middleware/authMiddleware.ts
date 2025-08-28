import { config } from '@/config/app.config';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/User';
import { TokenService } from '../services/tokenService';
import { logger } from '../utils/logger';
import { parseTimeString } from '../utils/timeUtils';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      accessToken?: string;
    }
  }
}

// We'll calculate this dynamically since TokenService isn't imported yet
const getRefreshTokenCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} => ({
  httpOnly: true,
  secure: config.app.environment === 'production',
  sameSite: 'strict' as const,
  maxAge: parseTimeString(config.jwt.refreshExpiresIn || '30d'),
  path: '/api/auth/refresh',
});

export const generateTokens = async (
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = jwt.sign(
    { userId, type: 'access' } as TokenPayload,
    config.jwt.accessSecret as jwt.Secret,
    { expiresIn: config.jwt.accessExpiresIn || '15m' } as jwt.SignOptions
  );

  // Create secure refresh token using TokenService
  const { token: refreshToken } = await TokenService.createRefreshToken(
    userId,
    undefined, // new family
    ip,
    userAgent
  );

  return { accessToken, refreshToken };
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
): void => {
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.cookie('refreshToken', '', {
    ...getRefreshTokenCookieOptions(),
    maxAge: 0,
  });
};

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return await handleTokenRefresh(req, res, next);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return await handleTokenRefresh(req, res, next);
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt.accessSecret
      ) as unknown as TokenPayload;

      if (decoded.type !== 'access') {
        return await handleTokenRefresh(req, res, next);
      }

      const user = await User.findOne({ userId: decoded.userId });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.accessToken = token;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return await handleTokenRefresh(req, res, next);
      }
      throw error;
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

async function handleTokenRefresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Use TokenService to validate and rotate the refresh token
    const userId = await verifyRefreshToken(refreshToken);

    // Get client info for audit trail
    const ip = req.ip || req.connection.remoteAddress || undefined;
    const userAgent = req.get('User-Agent');

    // Generate new tokens with rotation
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      userId,
      ip,
      userAgent
    );

    // Set new refresh token in cookie
    setRefreshTokenCookie(res, newRefreshToken);

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set user and new access token in request
    req.user = user;
    req.accessToken = accessToken;

    // Set the new access token in response header
    res.setHeader('X-New-Access-Token', accessToken);

    return next();
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export const verifyRefreshToken = async (token: string): Promise<string> => {
  try {
    // First, try to decode the JWT to get userId
    const decoded = jwt.verify(
      token,
      config.jwt.refreshSecret
    ) as unknown as TokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Now validate the token using TokenService (this will check for reuse, expiration, etc.)
    await TokenService.validateRefreshToken(token, decoded.userId);

    return decoded.userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.refreshSecret
    ) as unknown as TokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find and revoke the token
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
    const tokenRecord =
      await require('../models/RefreshToken').RefreshToken.findOne({
        hash: tokenHash,
        userId: decoded.userId,
      });

    if (tokenRecord) {
      await TokenService.revokeToken(tokenRecord.id);
    }
  } catch (error) {
    // If we can't decode the token, it's already invalid
    logger.error(`Could not revoke refresh token: ${error}`);
  }
};
