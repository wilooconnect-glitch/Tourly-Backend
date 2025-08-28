import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRefreshToken extends Document {
  id: string;
  familyId: string;
  userId: string;
  hash: string;
  expiresAt: Date;
  rotatedTo?: string;
  revokedAt?: Date;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    hash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    rotatedTo: {
      type: String,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ familyId: 1, revokedAt: 1 });
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema
);
