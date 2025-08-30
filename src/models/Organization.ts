import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/app.config';

export interface IOrganization extends Document {
  organizationId: string;
  name: string;
  description: string;
  slug: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    organizationId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);