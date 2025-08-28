import { IBranch } from '@/types/types';
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const branchSchema = new Schema<IBranch>(
  {
    branchId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    franchiseeId: {
      type: String,
      required: true,
      ref: 'Franchisee',
      refPath: 'franchiseeId',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 20,
    },
    type: {
      type: String,
      enum: ['main', 'sub'],
      default: 'sub',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed'],
      default: 'active',
    },
    addressId: {
      type: String,
      ref: 'Address',
      required: true,
    },
    // address: {
    //   street: String,
    //   city: String,
    //   state: String,
    //   country: String,
    //   postalCode: String,
    //   coordinates: {
    //     latitude: Number,
    //     longitude: Number,
    //   },
    // },
    contact: {
      phone: String,
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email',
        ],
      },
      managerName: String,
    },
    operatingHours: {
      monday: { open: String, close: String, isOpen: Boolean },
      tuesday: { open: String, close: String, isOpen: Boolean },
      wednesday: { open: String, close: String, isOpen: Boolean },
      thursday: { open: String, close: String, isOpen: Boolean },
      friday: { open: String, close: String, isOpen: Boolean },
      saturday: { open: String, close: String, isOpen: Boolean },
      sunday: { open: String, close: String, isOpen: Boolean },
    },
    settings: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      taxRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    metadata: {
      openingDate: Date,
      renovationDates: [Date],
      lastInspectionDate: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret): Partial<IBranch> => {
        const { _id, __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Indexes for faster queries
branchSchema.index({ franchiseeId: 1 });
branchSchema.index({ code: 1 });
branchSchema.index({ status: 1 });

// Ensure unique code per franchisee
branchSchema.index({ franchiseeId: 1, code: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
