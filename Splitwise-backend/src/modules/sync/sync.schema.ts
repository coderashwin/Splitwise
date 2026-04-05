import { Schema } from 'mongoose';

export const SyncEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: {
      type: String,
      enum: ['expense', 'group', 'settlement', 'friend', 'debt', 'notification'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    version: { type: Number, required: true },
    payload: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'sync_events',
  }
);

SyncEventSchema.index({ userId: 1, version: 1 });
// 30-day TTL
SyncEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
