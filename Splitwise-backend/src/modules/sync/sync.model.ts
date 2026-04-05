import { model, Document } from 'mongoose';
import { SyncEventSchema } from './sync.schema';

export interface ISyncEvent {
  userId: unknown;
  entityType: 'expense' | 'group' | 'settlement' | 'friend' | 'debt' | 'notification';
  entityId: unknown;
  action: 'create' | 'update' | 'delete';
  version: number;
  payload?: unknown;
  createdAt: Date;
}

export type SyncEventDocument = ISyncEvent & Document;

export const SyncEvent = model<SyncEventDocument>('SyncEvent', SyncEventSchema);
