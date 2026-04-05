import { Schema } from 'mongoose';

export const NotificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'EXPENSE_ADDED', 'EXPENSE_EDITED', 'EXPENSE_DELETED',
        'SETTLEMENT_RECORDED', 'SETTLEMENT_CONFIRMED',
        'FRIEND_REQUEST', 'FRIEND_ACCEPTED',
        'GROUP_INVITE', 'RECURRING_EXPENSE_FIRED',
        'REMINDER_YOU_OWE',
      ],
      required: true,
    },
    payload: {
      title: { type: String, required: true },
      body: { type: String, required: true },
      imageUrl: { type: String },
      expenseId: { type: Schema.Types.ObjectId },
      groupId: { type: Schema.Types.ObjectId },
      settlementId: { type: Schema.Types.ObjectId },
      actorId: { type: Schema.Types.ObjectId },
      actorName: { type: String },
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'notifications',
  }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });
// 90-day TTL
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
