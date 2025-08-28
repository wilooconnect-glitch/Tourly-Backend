import { IJobType } from '@/types/types';
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const jobTypeSchema = new Schema<IJobType>(
  {
    jobTypeId: {
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
    days: {
      type: Number,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
    },
    minutes: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const JobType = mongoose.model<IJobType>('JobType', jobTypeSchema);
