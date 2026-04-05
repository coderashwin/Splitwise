import { model, Document, Types } from 'mongoose';
import { ExpenseSchema } from './expense.schema';
import { IExpense } from './expense.types';

export type ExpenseDocument = Omit<IExpense, '_id'> & Document & { _id: Types.ObjectId };

export const Expense = model<ExpenseDocument>('Expense', ExpenseSchema);
