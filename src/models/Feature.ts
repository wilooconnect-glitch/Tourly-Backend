import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IFeature extends Document {
  featureId: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

const featureSchema = new Schema<IFeature>(
  {
    featureId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    roleId: {
      type: String,
      required: true,
      ref: 'Role',
      refPath: 'roleId', // Use the string ID field for reference
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
featureSchema.index({ roleId: 1 });
featureSchema.index({ featureId: 1 }, { unique: true });

// Validate that the roleId exists before saving
featureSchema.pre('save', async function (next) {
  const Role = mongoose.model('Role');
  const role = await Role.findOne({ roleId: this.roleId });

  if (!role) {
    throw new Error('Invalid roleId: Role does not exist');
  }

  next();
});

export const Feature = mongoose.model<IFeature>('Feature', featureSchema);
