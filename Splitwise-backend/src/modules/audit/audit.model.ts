import { model, Document } from 'mongoose';
import { AuditSchema } from './audit.schema';

export interface IAuditLog {
  actorId: unknown;
  action: string;
  entityType: string;
  entityId: unknown;
  groupId?: unknown;
  before?: unknown;
  after?: unknown;
  metadata?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  createdAt: Date;
}

export type AuditLogDocument = IAuditLog & Document;

export const AuditLog = model<AuditLogDocument>('AuditLog', AuditSchema);
