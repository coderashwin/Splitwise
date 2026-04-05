import './../../src/modules/auth/auth.types'; // ensure global augmentation
import { env } from '../config/env';
import { connectDatabase } from '../config/database';
import { connectRedis } from '../config/redis';
import { initFirebase } from '../config/fcm';
import { createFcmWorker } from './fcm.worker';
import { createAuditWorker } from './audit.worker';
import { createRecurringWorker } from './recurring.worker';
import { createDebtRecomputeWorker } from './debt-recompute.worker';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('worker-process');

async function start(): Promise<void> {
  // 1. Validate env
  log.info(`Starting worker process in ${env.NODE_ENV} env`);

  // 2. Connect MongoDB
  await connectDatabase();
  log.info('MongoDB connected');

  // 3. Connect Redis
  await connectRedis();
  log.info('Redis connected');

  // 4. Initialize Firebase
  initFirebase();

  // 5. Initialize all workers
  const workers = [
    createFcmWorker(),
    createAuditWorker(),
    createRecurringWorker(),
    createDebtRecomputeWorker(),
  ];

  // Log worker events
  for (const worker of workers) {
    worker.on('completed', (job) => {
      log.info({ jobId: job.id, queue: worker.name }, 'Job completed');
    });
    worker.on('failed', (job, err) => {
      log.error({ jobId: job?.id, queue: worker.name, err }, 'Job failed');
    });
    worker.on('stalled', (jobId) => {
      log.warn({ jobId, queue: worker.name }, 'Job stalled');
    });
  }

  log.info({ count: workers.length }, 'All workers initialized');

  // 6. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    log.info('Workers closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });
}

start().catch((err) => {
  log.error({ err }, 'Worker process failed to start');
  process.exit(1);
});
