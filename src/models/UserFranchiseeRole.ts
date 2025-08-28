import mongoose, { Document, Model, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUserFranchiseeRole extends Document {
  mappingId: string;
  userId: string;
  franchiseeId: string;
  roleId: string;
  branchId?: string;
  branchRoleId?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isPrimary: boolean;
  metadata?: {
    invitedBy?: string;
    invitedAt?: Date;
    acceptedAt?: Date;
    lastActiveAt?: Date;
    branchJoinedAt?: Date;
    branchLeftAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userFranchiseeRoleSchema = new Schema<IUserFranchiseeRole>(
  {
    mappingId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      refPath: 'userId', // Use the string ID field for reference
    },
    franchiseeId: {
      type: String,
      required: true,
      ref: 'Franchisee',
      refPath: 'franchiseeId', // Use the string ID field for reference
    },
    roleId: {
      type: String,
      required: true,
      ref: 'Role',
      // Reference using the roleId field from Role model
      refPath: 'roleId',
      validate: {
        validator: async function (v: string) {
          const Role = mongoose.model('Role');
          const role = await Role.findOne({ roleId: v });
          return role !== null;
        },
        message: props => `Role with roleId ${props.value} does not exist`,
      },
    },
    branchId: {
      type: String,
      required: false,
      ref: 'Branch',
      refPath: 'branchId', // Use the string ID field for reference
    },
    branchRoleId: {
      type: String,
      required: false,
      ref: 'Role',
      refPath: 'roleId', // Use the string ID field for reference
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'pending',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    metadata: {
      invitedBy: {
        type: String,
        ref: 'User',
        refPath: 'userId', // Use the string ID field for reference
      },
      invitedAt: Date,
      acceptedAt: Date,
      lastActiveAt: Date,
      branchJoinedAt: Date,
      branchLeftAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user can only have one primary franchisee
userFranchiseeRoleSchema.pre('save', async function (next) {
  if (this.isPrimary && (this.isNew || this.isModified('isPrimary'))) {
    const UserFranchiseeRoleModel = this
      .constructor as Model<IUserFranchiseeRole>;
    await UserFranchiseeRoleModel.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
  next();
});

// Indexes for faster queries
userFranchiseeRoleSchema.index({ mappingId: 1 }, { unique: true });
userFranchiseeRoleSchema.index({ userId: 1, franchiseeId: 1 });
userFranchiseeRoleSchema.index({ franchiseeId: 1, roleId: 1 });
userFranchiseeRoleSchema.index({ userId: 1, isPrimary: 1 });
userFranchiseeRoleSchema.index({ branchId: 1, branchRoleId: 1 });
userFranchiseeRoleSchema.index({ userId: 1, branchId: 1 });

// Compound unique indexes to prevent duplicate mappings
userFranchiseeRoleSchema.index(
  { userId: 1, franchiseeId: 1, roleId: 1 },
  { unique: true }
);

userFranchiseeRoleSchema.index(
  { userId: 1, branchId: 1, branchRoleId: 1 },
  { unique: true }
);

export const UserFranchiseeRole = mongoose.model<IUserFranchiseeRole>(
  'UserFranchiseeRole',
  userFranchiseeRoleSchema
);
