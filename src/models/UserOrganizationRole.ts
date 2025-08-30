import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/app.config';

export interface IUserOrganizationRole extends Document {
  mappingId: string;
  userId: string;
  organizationId: string;
  roleId: string;
  status: 'active' | 'inactive' | 'suspended';
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userOrganizationRoleSchema = new Schema<IUserOrganizationRole>(
  {
    mappingId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    userId: {
      type: String,
      required: true,
    },
    organizationId: {
      type: String,
      required: true,
    },
    roleId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserOrganizationRole = mongoose.model<IUserOrganizationRole>('UserOrganizationRole', userOrganizationRoleSchema);