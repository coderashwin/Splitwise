import { Worker, Job } from 'bullmq';
import { redisForBullMQ } from '../config/redis';
import { Expense } from '../modules/expenses/expense.model';
import { createExpense } from '../modules/expenses/expense.service';
import { getNextRunAt } from '../modules/expenses/recurring.service';
import { eventBus } from '../shared/events/event-bus';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('recurring.worker');

export function createRecurringWorker(): Worker {
  return new Worker<{ expenseId: string }>(
    'expense:recurring',
    async (job: Job<{ expenseId: string }>) => {
      const { expenseId } = job.data;

      const originalExpense = await Expense.findById(expenseId).lean();
      if (!originalExpense || originalExpense.isDeleted) {
        log.warn({ expenseId }, 'Original expense not found or deleted, skipping recurring fire');
        return;
      }

      if (!originalExpense.isRecurring || !originalExpense.recurringConfig) {
        log.warn({ expenseId }, 'Expense is not recurring, skipping');
        return;
      }

      const { recurringConfig } = originalExpense;

      // Check if we've passed the end date
      if (recurringConfig.endDate && new Date() > recurringConfig.endDate) {
        log.info({ expenseId }, 'Recurring expense past end date, stopping');
        return;
      }

      // Create a new expense clone
      const newExpense = await createExpense(
        {
          groupId: originalExpense.groupId ? String(originalExpense.groupId) : undefined,
          description: originalExpense.description,
          amount: originalExpense.amount,
          paidBy: String(originalExpense.paidBy),
          splitType: originalExpense.splitType as 'equal' | 'exact' | 'percentage' | 'shares',
          splits: (originalExpense.splits as Array<{ userId: unknown; amount: number; percentage?: number; shares?: number }>).map((s) => ({
            userId: String(s.userId),
            value: s.amount,
          })),
          category: originalExpense.category as { name: string; icon?: string; color?: string } | undefined,
          tags: originalExpense.tags as string[],
          date: new Date().toISOString(),
          isRecurring: false, // clones are not recurring
        },
        String(originalExpense.createdBy)
      );

      // Update nextRunAt on the original expense
      const nextRunAt = getNextRunAt(
        recurringConfig.frequency as 'daily' | 'weekly' | 'monthly',
        new Date()
      );

      await Expense.updateOne(
        { _id: expenseId },
        { $set: { 'recurringConfig.nextRunAt': nextRunAt } }
      );

      eventBus.emit('recurring.expense.fired', { expense: newExpense });
      log.info({ expenseId, newExpenseId: newExpense._id }, 'Recurring expense fired');
    },
    {
      connection: redisForBullMQ,
      concurrency: 10,
    }
  );
}
