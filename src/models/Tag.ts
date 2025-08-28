import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITags } from '../types/types';

const tagSchema = new Schema<ITags>(
  {
    tagId: { type: String, required: true, unique: true, default: uuidv4 },
    name: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, required: true },
  },
  { timestamps: true }
);

const Tag = mongoose.model<ITags>('Tag', tagSchema);

export default Tag;
