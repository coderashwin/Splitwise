import { model, Document, Types } from 'mongoose';
import { NotificationSchema } from './notification.schema';

export interface INotification {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  type: string;
  payload: {
    title: string;
    body: string;
    imageUrl?: string;
    expenseId?: Types.ObjectId;
    groupId?: Types.ObjectId;
    settlementId?: Types.ObjectId;
    actorId?: Types.ObjectId;
    actorName?: string;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationDocument = Omit<INotification, '_id'> & Document & { _id: Types.ObjectId };

export const Notification = model<NotificationDocument>('Notification', NotificationSchema);
