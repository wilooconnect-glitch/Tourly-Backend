import mongoose from 'mongoose';

export const dummyInvites = [
  {
    email: 'alice@example.com',
    orgId: new mongoose.Types.ObjectId(), // replace with real orgId if needed
    token: 'abc123token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    used: false,
  },
  {
    email: 'bob@example.com',
    orgId: new mongoose.Types.ObjectId(),
    token: 'def456token',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    used: true,
  },
  {
    email: 'carol@example.com',
    orgId: new mongoose.Types.ObjectId(),
    token: 'ghi789token',
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    used: false,
  },
];
