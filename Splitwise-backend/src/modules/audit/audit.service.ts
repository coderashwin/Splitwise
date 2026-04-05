import { Types } from 'mongoose';

export interface AuditJobParams {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  groupId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
}

export interface AuditJobData {
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  groupId?: Types.ObjectId;
  before?: unknown;
  after?: unknown;
  metadata?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  createdAt: Date;
}

/**
 * Build a serializable audit job payload for BullMQ.
 * Does NOT write to DB — the worker (audit.worker.ts) does the actual write.
 *
 * Usage in services:
 *   const auditJob = buildAuditJob({ actorId, action: 'expense.create', ... });
 *   await auditQueue.add('write', auditJob);
 */
export function buildAuditJob(params: AuditJobParams): AuditJobData {
  return {
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    entityType: params.entityType,
    entityId: new Types.ObjectId(params.entityId),
    ...(params.groupId ? { groupId: new Types.ObjectId(params.groupId) } : {}),
    before: params.before,
    after: params.after,
    metadata: params.metadata,
    createdAt: new Date(),
  };
}
