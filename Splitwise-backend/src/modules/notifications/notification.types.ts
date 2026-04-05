import { Types } from 'mongoose';

export type NotificationType =
  | 'EXPENSE_ADDED'
  | 'EXPENSE_EDITED'
  | 'EXPENSE_DELETED'
  | 'SETTLEMENT_RECORDED'
  | 'SETTLEMENT_CONFIRMED'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'GROUP_INVITE'
  | 'RECURRING_EXPENSE_FIRED'
  | 'REMINDER_YOU_OWE';

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  expenseId?: Types.ObjectId;
  groupId?: Types.ObjectId;
  settlementId?: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorName?: string;
}

export interface FcmJobData {
  recipientId: string;
  notificationId: string;
}
