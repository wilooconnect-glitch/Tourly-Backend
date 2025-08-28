import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IOfficeJobType extends Document {
  officeJobTypeId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const officeJobTypeSchema = new Schema<IOfficeJobType>(
  {
    officeJobTypeId: {
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

export const OfficeJobType = mongoose.model<IOfficeJobType>(
  'OfficeJobType',
  officeJobTypeSchema
);
