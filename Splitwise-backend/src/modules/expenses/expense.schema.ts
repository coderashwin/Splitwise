import { Schema } from 'mongoose';

const SplitSubSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number },
    shares: { type: Number },
    isPaid: { type: Boolean, default: false },
  },
  { _id: false }
);

const CategorySubSchema = new Schema(
  {
    name: { type: String, required: true },
    icon: { type: String },
    color: { type: String },
  },
  { _id: false }
);

const RecurringConfigSubSchema = new Schema(
  {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    endDate: { type: Date },
    nextRunAt: { type: Date, required: true },
  },
  { _id: false }
);

export const ExpenseSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    description: { type: String, required: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 1 },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      required: true,
    },
    splits: { type: [SplitSubSchema], default: [] },
    category: { type: CategorySubSchema },
    tags: { type: [String], default: [] },
    receiptKeys: { type: [String], default: [] },
    date: { type: Date, required: true, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringJobId: { type: String },
    recurringConfig: { type: RecurringConfigSubSchema },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'expenses',
  }
);

// Indexes
ExpenseSchema.index({ groupId: 1, date: -1 });
ExpenseSchema.index({ 'splits.userId': 1, date: -1 });
ExpenseSchema.index({ paidBy: 1, date: -1 });
ExpenseSchema.index({ isRecurring: 1, 'recurringConfig.nextRunAt': 1 });
ExpenseSchema.index(
  { isDeleted: 1 },
  { partialFilterExpression: { isDeleted: false } }
);
