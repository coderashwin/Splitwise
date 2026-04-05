import { Schema } from 'mongoose';

export const AuditSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
      requestId: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

AuditSchema.index({ entityId: 1, createdAt: -1 });
AuditSchema.index({ groupId: 1, createdAt: -1 });
AuditSchema.index({ actorId: 1, createdAt: -1 });
// 180-day TTL
AuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });
