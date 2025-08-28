import { config } from '@/config/app.config';
import { createHash, randomBytes } from 'crypto';
import { IRefreshToken, RefreshToken } from '../models/RefreshToken';
import { parseTimeString } from '../utils/timeUtils';

export interface TokenFamily {
  familyId: string;
  userId: string;
  tokens: IRefreshToken[];
}

export class TokenService {
  /**
   * Generate a cryptographically secure random refresh token
   */
  private static generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash a refresh token for secure storage
   */
  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new refresh token record
   */
  static async createRefreshToken(
    userId: string,
    familyId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ token: string; record: IRefreshToken }> {
    const token = this.generateRandomToken();
    const hash = this.hashToken(token);
    const newFamilyId = familyId || this.generateRandomToken();

    const record = new RefreshToken({
      id: this.generateRandomToken(),
      familyId: newFamilyId,
      userId,
      hash,
      expiresAt: new Date(Date.now() + this.getRefreshTokenTTL()),
      ip,
      userAgent,
    });

    await record.save();
    return { token, record };
  }

  /**
   * Rotate a refresh token (create new one, mark old as rotated)
   */
  static async rotateRefreshToken(
    oldToken: string,
    userId: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ token: string; record: IRefreshToken }> {
    // Find the old token record
    const oldTokenHash = this.hashToken(oldToken);
    const oldRecord = await RefreshToken.findOne({
      hash: oldTokenHash,
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!oldRecord) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if this token was already rotated (potential reuse attack)
    if (oldRecord.rotatedTo) {
      await this.revokeTokenFamily(oldRecord.familyId);
      throw new Error('Token reuse detected - security compromised');
    }

    // Create new token in the same family
    const { token, record: newRecord } = await this.createRefreshToken(
      userId,
      oldRecord.familyId,
      ip,
      userAgent
    );

    // Mark old token as rotated
    oldRecord.rotatedTo = newRecord.id;
    await oldRecord.save();

    return { token, record: newRecord };
  }

  /**
   * Validate a refresh token
   */
  static async validateRefreshToken(
    token: string,
    userId: string
  ): Promise<IRefreshToken> {
    const hash = this.hashToken(token);

    const record = await RefreshToken.findOne({
      hash,
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if this token was already rotated
    if (record.rotatedTo) {
      await this.revokeTokenFamily(record.familyId);
      throw new Error('Token reuse detected - security compromised');
    }

    return record;
  }

  /**
   * Revoke a specific token
   */
  static async revokeToken(tokenId: string): Promise<void> {
    await RefreshToken.findByIdAndUpdate(tokenId, {
      revokedAt: new Date(),
    });
  }

  /**
   * Revoke an entire token family (for security)
   */
  static async revokeTokenFamily(familyId: string): Promise<void> {
    await RefreshToken.updateMany({ familyId }, { revokedAt: new Date() });
  }

  /**
   * Revoke all tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId }, { revokedAt: new Date() });
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount || 0;
  }

  /**
   * Get token family information
   */
  static async getTokenFamily(familyId: string): Promise<TokenFamily | null> {
    const tokens = await RefreshToken.find({ familyId }).sort({
      createdAt: -1,
    });

    if (tokens.length === 0) {
      return null;
    }

    const firstToken = tokens[0];
    if (!firstToken) {
      return null;
    }

    return {
      familyId,
      userId: firstToken.userId,
      tokens,
    };
  }

  /**
   * Get refresh token TTL in milliseconds
   */
  private static getRefreshTokenTTL(): number {
    const ttl = config.jwt.refreshExpiresIn;
    return parseTimeString(ttl || '30d');
  }

  private static parseTimeString(timeString: string): number {
    const match = timeString.match(/^(\d+)([dhms])$/);
    if (match && match[1] && match[2]) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case 'd':
          return value * 24 * 60 * 60 * 1000;
        case 'h':
          return value * 60 * 60 * 1000;
        case 'm':
          return value * 60 * 1000;
        case 's':
          return value * 1000;
        default:
          return 30 * 24 * 60 * 60 * 1000; // 30 days from config default
      }
    }
    return 30 * 24 * 60 * 60 * 1000; // 30 days from config default
  }
}
