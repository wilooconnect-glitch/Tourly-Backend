import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IContractor extends Document {
  contractorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: string;
  permissionLevel: string;
  fieldTech: boolean;
  trackLocation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contractorSchema = new Schema<IContractor>(
  {
    contractorId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    permissionLevel: {
      type: String,
      required: true,
    },
    fieldTech: {
      type: Boolean,
      required: true,
    },
    trackLocation: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Contractor = mongoose.model<IContractor>(
  'Contractor',
  contractorSchema
);
