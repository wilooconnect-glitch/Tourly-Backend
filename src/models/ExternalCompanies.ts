import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IExternalCompanies extends Document {
  externalCompanyId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const externalCompaniesSchema = new Schema<IExternalCompanies>(
  {
    externalCompanyId: {
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
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ExternalCompanies = mongoose.model<IExternalCompanies>(
  'ExternalCompanies',
  externalCompaniesSchema
);
