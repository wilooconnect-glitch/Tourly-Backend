import { IClient } from '@/types/types';
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const clientSchema = new Schema<IClient>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: () => uuidv4(),
    },
    clientNumber: {
      type: Number,
      required: true,
    },
    branchId: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      // required: true,
      unique: false,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
      default: null,
      required: false,
    },
    phone: {
      type: String,
      required: true,
      unique: true, // enforce unique phone numbers
      trim: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    altPhone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    companyName: { type: String, required: false, trim: true },
    adSource: { type: String, trim: true },
    allowBilling: { type: Boolean, default: false },
    taxExempt: { type: Boolean, default: false },
    addressIds: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Add compound unique index for clientNumber + branchId
clientSchema.index({ clientNumber: 1, branchId: 1 }, { unique: true });

// Auto-increment clientNumber before save
clientSchema.pre('validate', async function (next) {
  if (!this.clientNumber) {
    const lastClient = await mongoose
      .model<IClient>('Client')
      .findOne({ branchId: this.branchId })
      .sort({ clientNumber: -1 });
    this.clientNumber = lastClient ? (lastClient?.clientNumber ?? 0) + 1 : 1;
  }
  next();
});

export const Client = mongoose.model<IClient>('Client', clientSchema);
