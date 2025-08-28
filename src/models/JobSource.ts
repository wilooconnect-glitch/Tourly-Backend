import { IJobSource } from '@/types/types';
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const jobSourceSchema = new Schema<IJobSource>(
  {
    jobSourceId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    branchId: {
      type: String,
      required: true,
    },
    franchiseeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    displayOrder: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const JobSource = mongoose.model<IJobSource>(
  'JobSource',
  jobSourceSchema
);
