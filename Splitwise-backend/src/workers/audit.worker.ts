import { Worker, Job } from 'bullmq';
import { redisForBullMQ } from '../config/redis';
import { AuditLog } from '../modules/audit/audit.model';
import { AuditJobData } from '../modules/audit/audit.service';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('audit.worker');

export function createAuditWorker(): Worker {
  return new Worker<AuditJobData>(
    'audit:write',
    async (job: Job<AuditJobData>) => {
      await AuditLog.create(job.data);
      log.info({ action: job.data.action, entityId: job.data.entityId }, 'Audit log written');
    },
    {
      connection: redisForBullMQ,
      concurrency: 100,
    }
  );
}
