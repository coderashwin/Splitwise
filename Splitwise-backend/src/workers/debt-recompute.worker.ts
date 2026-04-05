import { Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import { redisForBullMQ } from '../config/redis';
import { Expense } from '../modules/expenses/expense.model';
import { Debt } from '../modules/settlements/settlement.model';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('debt-recompute.worker');

/**
 * NOTE: This worker is for admin correction and post-migration fixes only.
 * Normal expense operations update debts in-transaction via delta (expense.service.ts).
 * This worker does a FULL recompute from scratch.
 */
export function createDebtRecomputeWorker(): Worker {
  return new Worker<{ groupId: string }>(
    'debt:recompute',
    async (job: Job<{ groupId: string }>) => {
      const { groupId } = job.data;
      log.info({ groupId }, 'Starting full debt recompute');

      const session = await (await import('mongoose')).default.startSession();
      session.startTransaction();
      try {
        // Clear all existing debts for this group
        await Debt.deleteMany({ groupId: new Types.ObjectId(groupId) }, { session });

        // Fetch all active expenses for this group
        const expenses = await Expense.find({
          groupId: new Types.ObjectId(groupId),
          isDeleted: false,
        }, null, { session }).lean();

        // Build debt map: {from}:{to} => amount
        const debtMap = new Map<string, { from: string; to: string; amount: number }>();

        for (const expense of expenses) {
          const paidBy = String(expense.paidBy);
          const splits = expense.splits as Array<{ userId: unknown; amount: number }>;

          for (const split of splits) {
            const splitUserId = String(split.userId);
            if (splitUserId === paidBy) continue;
            if (split.amount === 0) continue;

            const key = `${splitUserId}:${paidBy}`;
            const reverseKey = `${paidBy}:${splitUserId}`;

            if (debtMap.has(reverseKey)) {
              // Offset against reverse debt
              const reverseDebt = debtMap.get(reverseKey)!;
              reverseDebt.amount -= split.amount;
              if (reverseDebt.amount < 0) {
                // Reversal
                debtMap.delete(reverseKey);
                debtMap.set(key, { from: splitUserId, to: paidBy, amount: Math.abs(reverseDebt.amount) });
              } else if (reverseDebt.amount === 0) {
                debtMap.delete(reverseKey);
              }
            } else {
              const existing = debtMap.get(key);
              if (existing) {
                existing.amount += split.amount;
              } else {
                debtMap.set(key, { from: splitUserId, to: paidBy, amount: split.amount });
              }
            }
          }
        }

        // Write new debt records
        const debtDocs = Array.from(debtMap.values())
          .filter((d) => d.amount > 0)
          .map((d) => ({
            from: new Types.ObjectId(d.from),
            to: new Types.ObjectId(d.to),
            groupId: new Types.ObjectId(groupId),
            amount: d.amount,
            lastUpdated: new Date(),
          }));

        if (debtDocs.length > 0) {
          await Debt.insertMany(debtDocs, { session });
        }

        await session.commitTransaction();
        log.info({ groupId, debtCount: debtDocs.length }, 'Debt recompute complete');
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    },
    {
      connection: redisForBullMQ,
      concurrency: 20,
    }
  );
}
