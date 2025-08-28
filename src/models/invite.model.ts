import { IInvite } from '@/types/types';
import { Schema, model } from 'mongoose';

const inviteSchema = new Schema<IInvite>(
  {
    email: {
      type: String,
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Org',
    },
    roleId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const InviteModel = model<IInvite>('Invite', inviteSchema);
