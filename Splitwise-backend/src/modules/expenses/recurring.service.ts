import { Queue } from 'bullmq';
import { redisForBullMQ } from '../../config/redis';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('recurring.service');

let recurringQueue: Queue | null = null;

export function getRecurringQueue(): Queue {
  if (!recurringQueue) {
    recurringQueue = new Queue('expense:recurring', {
      connection: redisForBullMQ,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
  }
  return recurringQueue;
}

export async function scheduleRecurringExpense(expenseId: string, nextRunAt: Date): Promise<string> {
  const queue = getRecurringQueue();
  const delay = Math.max(0, nextRunAt.getTime() - Date.now());
  const job = await queue.add(
    'fire',
    { expenseId },
    { delay, jobId: `recurring:${expenseId}:${nextRunAt.getTime()}` }
  );
  log.info({ expenseId, nextRunAt, delay }, 'Recurring expense scheduled');
  return job.id ?? '';
}

export async function cancelRecurringExpense(expenseId: string): Promise<void> {
  const queue = getRecurringQueue();
  // Remove all jobs for this expense
  const jobs = await queue.getJobs(['delayed', 'waiting']);
  for (const job of jobs) {
    const data = job.data as { expenseId: string };
    if (data.expenseId === expenseId) {
      await job.remove();
    }
  }
  log.info({ expenseId }, 'Recurring expense cancelled');
}

export function getNextRunAt(
  frequency: 'daily' | 'weekly' | 'monthly',
  fromDate: Date = new Date()
): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
