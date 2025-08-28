import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISchedule extends Document {
  scheduleId: string;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  recurring: boolean;
  allDay: boolean;
  recurringType: string;
  recurringInterval: number;
  recurringCount: number;
  subContractorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    recurring: {
      type: Boolean,
      required: true,
    },
    allDay: {
      type: Boolean,
      required: true,
    },
    recurringType: {
      type: String,
      required: true,
    },
    recurringInterval: {
      type: Number,
      required: true,
    },
    recurringCount: {
      type: Number,
      required: true,
    },
    subContractorId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);
