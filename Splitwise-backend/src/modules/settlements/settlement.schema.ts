import { Schema } from 'mongoose';

export const SettlementSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    note: { type: String, maxlength: 200 },
    status: {
      type: String,
      enum: ['pending_confirmation', 'confirmed'],
      default: 'pending_confirmation',
    },
    confirmedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'settlements',
  }
);

SettlementSchema.index({ from: 1, to: 1, groupId: 1 });
SettlementSchema.index({ from: 1, createdAt: -1 });
SettlementSchema.index({ to: 1, status: 1 });

export const DebtSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    amount: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'debts',
  }
);

DebtSchema.index({ from: 1, to: 1, groupId: 1 }, { unique: true });
DebtSchema.index({ from: 1, groupId: 1 });
DebtSchema.index({ to: 1, groupId: 1 });
