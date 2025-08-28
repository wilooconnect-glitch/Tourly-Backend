import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/app.config';
import { Franchisee, IFranchisee } from './Franchisee';
import { IRole, Role } from './Role';
import { IUserFranchiseeRole, UserFranchiseeRole } from './UserFranchiseeRole';

export interface IUser extends Document {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  preferences?: {
    language?: string;
    theme?: 'light' | 'dark';
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFranchisees(): Promise<
    Array<{
      franchisee: IFranchisee;
      role: IRole;
      status: string;
      isPrimary: boolean;
    }>
  >;
  getPrimaryFranchisee(): Promise<{
    franchisee: IFranchisee;
    role: IRole;
    status: string;
  } | null>;
  hasRole(franchiseeId: string, roleName: string): Promise<boolean>;
  addToFranchisee(
    franchiseeId: string,
    roleId: string,
    isPrimary?: boolean
  ): Promise<IUserFranchiseeRole>;
  removeFromFranchisee(franchiseeId: string): Promise<void>;
  getPermissionsForFranchisee(franchiseeId: string): Promise<
    Array<{
      resource: string;
      actions: string[];
    }>
  >;
}

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    lastLoginAt: {
      type: Date,
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(config.jwt.bcryptRounds as number);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get all franchisees for the user with their roles
userSchema.methods.getFranchisees = async function (): Promise<
  Array<{
    franchisee: IFranchisee;
    role: IRole;
    status: string;
    isPrimary: boolean;
  }>
> {
  const memberships = await UserFranchiseeRole.find({ userId: this.userId })
    .populate({
      path: 'franchiseeId',
      model: 'Franchisee',
      select: 'franchiseeId name status',
    })
    .populate({
      path: 'roleId',
      model: 'Role',
      select: 'roleId name permissions',
    })
    .sort({ isPrimary: -1, createdAt: -1 });

  return memberships.map(membership => ({
    franchisee: membership.franchiseeId as unknown as IFranchisee,
    role: membership.roleId as unknown as IRole,
    status: membership.status,
    isPrimary: membership.isPrimary,
  }));
};

// Get user's primary franchisee
userSchema.methods.getPrimaryFranchisee = async function (): Promise<{
  franchisee: IFranchisee;
  role: IRole;
  status: string;
} | null> {
  const membership = await UserFranchiseeRole.findOne({
    userId: this.userId,
    isPrimary: true,
  })
    .populate({
      path: 'franchiseeId',
      model: 'Franchisee',
      select: 'franchiseeId name status',
    })
    .populate({
      path: 'roleId',
      model: 'Role',
      select: 'roleId name permissions',
    });

  if (!membership) return null;

  return {
    franchisee: membership.franchiseeId as unknown as IFranchisee,
    role: membership.roleId as unknown as IRole,
    status: membership.status,
  };
};

// Check if user has a specific role in a franchisee
userSchema.methods.hasRole = async function (
  franchiseeId: string,
  roleName: string
): Promise<boolean> {
  const membership = await UserFranchiseeRole.findOne({
    userId: this.userId,
    franchiseeId,
    status: 'active',
  }).populate({
    path: 'roleId',
    model: 'Role',
    select: 'roleId name permissions',
  });

  if (!membership) return false;
  return (membership.roleId as unknown as IRole).name === roleName;
};

// Add user to a franchisee with a role
userSchema.methods.addToFranchisee = async function (
  franchiseeId: string,
  roleId: string,
  isPrimary: boolean = false
): Promise<IUserFranchiseeRole> {
  // Check if franchisee and role exist
  const [franchisee, role] = await Promise.all([
    Franchisee.findOne({ franchiseeId }),
    Role.findOne({ roleId }),
  ]);

  if (!franchisee || !role) {
    throw new Error('Franchisee or role not found');
  }

  // Create or update the membership
  const membership = await UserFranchiseeRole.findOneAndUpdate(
    {
      userId: this.userId,
      franchiseeId,
    },
    {
      roleId,
      isPrimary,
      status: 'active',
      $setOnInsert: {
        metadata: {
          acceptedAt: new Date(),
        },
      },
    },
    {
      upsert: true,
      new: true,
    }
  );

  return membership;
};

// Remove user from a franchisee
userSchema.methods.removeFromFranchisee = async function (
  franchiseeId: string
): Promise<void> {
  await UserFranchiseeRole.deleteOne({
    userId: this.userId,
    franchiseeId,
  });
};

// Get user's permissions for a specific franchisee
userSchema.methods.getPermissionsForFranchisee = async function (
  franchiseeId: string
): Promise<
  Array<{
    resource: string;
    actions: string[];
  }>
> {
  const membership = await UserFranchiseeRole.findOne({
    userId: this.userId,
    franchiseeId,
    status: 'active',
  }).populate({
    path: 'roleId',
    model: 'Role',
    select: 'roleId name permissions',
  });

  if (!membership) return [];

  const role = membership.roleId as unknown as IRole;
  return role.permissions;
};

export const User = mongoose.model<IUser>('User', userSchema);
