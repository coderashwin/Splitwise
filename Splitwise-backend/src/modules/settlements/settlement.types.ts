import { Types } from 'mongoose';

export interface ISettlementTypes {
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

export interface RecordSettlementDto {
  from: string;
  to: string;
  amount: number;
  groupId?: string;
  note?: string;
}
