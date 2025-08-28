import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Permission {
  resource: string;
  actions: Array<'create' | 'read' | 'update' | 'delete' | 'manage'>;
}

export interface IRole extends Document {
  roleId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    permissions: [
      {
        resource: {
          type: String,
          required: true,
          trim: true,
        },
        actions: [
          {
            type: String,
            enum: ['create', 'read', 'update', 'delete', 'manage'],
            required: true,
          },
        ],
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure system roles cannot be modified
roleSchema.pre('save', function (next) {
  if (this.isSystemRole && !this.isNew) {
    const err = new Error('System roles cannot be modified');
    return next(err);
  }
  next();
});

export const Role = mongoose.model<IRole>('Role', roleSchema);

// Create default system roles if they don't exist
export async function ensureSystemRoles(): Promise<void> {
  const systemRoles = [
    {
      name: 'Super Admin',
      description: 'Full system access',
      permissions: [
        {
          resource: '*',
          actions: ['manage'],
        },
      ],
      isSystemRole: true,
    },
    {
      name: 'Franchisee Admin',
      description: 'Full franchisee access',
      permissions: [
        {
          resource: 'users',
          actions: ['create', 'read', 'update', 'delete'],
        },
        {
          resource: 'roles',
          actions: ['read'],
        },
        {
          resource: 'franchisee',
          actions: ['read', 'update'],
        },
      ],
      isSystemRole: true,
    },
    {
      name: 'Member',
      description: 'Basic member access',
      permissions: [
        {
          resource: 'users',
          actions: ['read'],
        },
        {
          resource: 'franchisee',
          actions: ['read'],
        },
      ],
      isSystemRole: true,
    },
  ];

  for (const role of systemRoles) {
    await Role.findOneAndUpdate({ name: role.name }, role, {
      upsert: true,
      new: true,
    });
  }
}
