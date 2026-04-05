import { Types } from 'mongoose';

export interface ISplitEntry {
  userId: Types.ObjectId;
  amount: number;           // integer paise
  percentage?: number;
  shares?: number;
  isPaid: boolean;
}

export interface ICategory {
  name: string;
  icon?: string;
  color?: string;
}

export interface IRecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
  nextRunAt: Date;
}

export interface IExpense {
  _id: Types.ObjectId;
  groupId?: Types.ObjectId;
  description: string;
  amount: number;           // integer paise
  paidBy: Types.ObjectId;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: ISplitEntry[];
  category?: ICategory;
  tags: string[];
  receiptKeys: string[];
  date: Date;
  isRecurring: boolean;
  recurringJobId?: string;
  recurringConfig?: IRecurringConfig;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  groupId?: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits?: Array<{ userId: string; value?: number }>;
  category?: ICategory;
  tags?: string[];
  date?: string;
  isRecurring?: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    nextRunAt: string;
  };
}

export interface UpdateExpenseDto {
  description?: string;
  amount?: number;
  paidBy?: string;
  splitType?: 'equal' | 'exact' | 'percentage' | 'shares';
  splits?: Array<{ userId: string; value?: number }>;
  category?: ICategory;
  tags?: string[];
  date?: string;
}

export interface DebtDelta {
  from: string;  // owes money
  to: string;    // is owed money
  groupId?: string;
  amount: number; // paise, always positive
}
