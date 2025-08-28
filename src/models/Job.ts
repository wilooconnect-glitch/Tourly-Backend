import { IJob, IJobItem, IPayment, ISchedule } from '@/types/types';
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const jobItemSchema = new Schema<IJobItem>(
  {
    item: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    amount: { type: Number, required: true },
    taxable: { type: Boolean, default: false },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    amount: { type: Number, required: true },
    paymentType: { type: String, required: true },
  },
  { _id: false }
);

const scheduleSchema = new Schema<ISchedule>(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { _id: false }
);

const jobSchema = new Schema<IJob>(
  {
    jobId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    jobNumber: {
      type: Number,
      unique: true,
      required: true,
    },
    clientId: {
      type: String,
      ref: 'Client',
      refPath: 'clientId',
      required: true,
    },
    branchId: {
      type: String,
      required: true,
      trim: true,
    },
    addressId: {
      type: String,
      ref: 'Address',
      required: true,
    },
    jobTypeId: {
      type: String,
      ref: 'JobType',
      refPath: 'jobTypeId',
      required: true,
    },
    jobSourceId: {
      type: String,
      ref: 'JobSource',
      refPath: 'jobSourceId',
      required: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    techId: {
      type: String,
      ref: 'User',
      refPath: 'userId',
      required: true,
    },
    schedule: {
      type: scheduleSchema,
      // required: true,
    },
    jobItems: {
      type: [jobItemSchema],
      default: [],
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    jobStatus: {
      type: String,
      enum: [
        'SUBMITTED',
        'IN_PROGRESS',
        'CANCELLED',
        'DONE',
        'PENDING',
        'DONE_PENDING_APPROVAL',
      ],
      default: 'PENDING',
      required: true,
    },
    tagIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual fields for relationships
jobSchema.virtual('client', {
  ref: 'Client',
  localField: 'clientId',
  foreignField: 'clientId',
  justOne: true,
});

jobSchema.virtual('jobSource', {
  ref: 'JobSource',
  localField: 'jobSourceId',
  foreignField: 'jobSourceId',
  justOne: true,
});

jobSchema.virtual('jobType', {
  ref: 'JobType',
  localField: 'jobTypeId',
  foreignField: 'jobTypeId',
  justOne: true,
});

jobSchema.virtual('tags', {
  ref: 'Tag',
  localField: 'tagIds',
  foreignField: 'tagId',
  justOne: false,
});

// Auto-increment jobNumber before save
jobSchema.pre('validate', async function (next) {
  if (!this.jobNumber) {
    const lastJob = await mongoose
      .model<IJob>('Job')
      .findOne()
      .sort({ jobNumber: -1 });
    this.jobNumber = lastJob ? lastJob.jobNumber + 1 : 1;
  }
  next();
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
