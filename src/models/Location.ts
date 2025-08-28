import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ILocation extends Document {
  locationId: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  region: string;
  state: string;
  zip_code: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    locationId: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    address_line_1: {
      type: String,
      required: true,
    },
    address_line_2: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip_code: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Location = mongoose.model<ILocation>('Location', locationSchema);
