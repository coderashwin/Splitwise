import { model, Document, Types } from 'mongoose';
import { SettlementSchema, DebtSchema } from './settlement.schema';

export interface ISettlement {
  _id: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  amount: number;
  groupId?: Types.ObjectId;
  note?: string;
  status: 'pending_confirmation' | 'confirmed';
  confirmedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDebt {
  _id: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  groupId?: Types.ObjectId;
  amount: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SettlementDocument = Omit<ISettlement, '_id'> & Document & { _id: Types.ObjectId };
export type DebtDocument = Omit<IDebt, '_id'> & Document & { _id: Types.ObjectId };

export const Settlement = model<SettlementDocument>('Settlement', SettlementSchema);
export const Debt = model<DebtDocument>('Debt', DebtSchema);
