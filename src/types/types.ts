import { Document, ObjectId, Types } from 'mongoose';

export interface Context {
  isAuthenticated: boolean;
}

export interface IAddress extends Document {
  addressId: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  map: {
    latitude: number;
    longitude: number;
  };
  isPrimary: boolean;
  type: string;
}

export interface IInvite extends Document {
  _id?: ObjectId;
  email: string;
  orgId: Types.ObjectId;
  roleId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInviteTokenPayload {
  email: string;
  orgId: string;
}

export interface ITags {
  tagId: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClient extends Document {
  clientId: string;
  clientNumber?: number;
  branchId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  altPhone?: string;
  companyName?: string;
  adSource?: string;
  allowBilling: boolean;
  taxExempt: boolean;
  addressIds: string[];
  tags: string[];
}

export interface IJobItem {
  item: string;
  qty: number;
  price: number;
  cost: number;
  amount: number;
  taxable: boolean;
}

export interface IPayment {
  amount: number;
  paymentType: string;
}

export interface ISchedule {
  startTime: Date;
  endTime: Date;
}

export interface IJob extends Document {
  jobId: string;
  jobNumber: number;
  clientId: string;
  client: IClient;
  branchId: string;
  addressId: string;
  jobTypeId: string;
  jobSourceId: string;
  description: string;
  techId: string;
  schedule: ISchedule;
  jobItems: IJobItem[];
  payments: IPayment[];
  jobStatus:
    | 'SUBMITTED'
    | 'IN_PROGRESS'
    | 'CANCELLED'
    | 'DONE'
    | 'PENDING'
    | 'DONE_PENDING_APPROVAL';
  tagIds: string[];
}

export interface IJobType extends Document {
  jobTypeId: string;
  branchId: string;
  franchiseeId: string;
  name: string;
  description: string;
  displayOrder: number;
  days: number;
  hours: number;
  minutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobSource extends Document {
  jobSourceId: string;
  branchId: string;
  franchiseeId: string;
  name: string;
  description: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBranch extends Document {
  branchId: string;
  franchiseeId: string;
  name: string;
  code: string;
  type: 'main' | 'sub';
  status: 'active' | 'inactive' | 'closed';
  addressId: string;
  contact?: {
    phone?: string;
    email?: string;
    managerName?: string;
  };
  operatingHours?: {
    monday?: { open?: string; close?: string; isOpen: boolean };
    tuesday?: { open?: string; close?: string; isOpen: boolean };
    wednesday?: { open?: string; close?: string; isOpen: boolean };
    thursday?: { open?: string; close?: string; isOpen: boolean };
    friday?: { open?: string; close?: string; isOpen: boolean };
    saturday?: { open?: string; close?: string; isOpen: boolean };
    sunday?: { open?: string; close?: string; isOpen: boolean };
  };
  settings?: {
    timezone?: string;
    currency?: string;
    taxRate?: number;
  };
  metadata?: {
    openingDate?: Date;
    renovationDates?: Date[];
    lastInspectionDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
