import { Types, ClientSession } from 'mongoose';
import { mongoose } from '../../config/database';
import { Expense } from './expense.model';
import { IExpense, CreateExpenseDto, UpdateExpenseDto, DebtDelta } from './expense.types';
import {
  computeEqualSplit,
  computeExactSplit,
  computePercentageSplit,
  computeSharesSplit,
  validateSplitSum,
  SplitParticipant,
} from './split-engine';
import { Group } from '../groups/group.model';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { eventBus } from '../../shared/events/event-bus';
import { invalidateKeys, CacheKeys } from '../../shared/utils/cache';
import { buildAuditJob } from '../audit/audit.service';
import { writeSyncEventsForUsers } from '../sync/sync.service';
import { buildCursorQuery, buildPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('expense.service');

// Lazy import audit queue to avoid circular deps at module load time
async function getAuditQueue(): Promise<import('bullmq').Queue> {
  const { Queue } = await import('bullmq');
  const { redisForBullMQ } = await import('../../config/redis');
  return new Queue('audit:write', { connection: redisForBullMQ });
}

async function validateGroupMembership(
  groupId: string,
  userIds: string[],
  session?: ClientSession
): Promise<void> {
  const group = await Group.findOne({ _id: new Types.ObjectId(groupId), isActive: true }, null, {
    session,
  }).lean();
  if (!group) throw new NotFoundError('Group not found');

  const memberIds = (group.members as Array<{ userId: Types.ObjectId }>).map((m) =>
    String(m.userId)
  );
  for (const uid of userIds) {
    if (!memberIds.includes(uid)) {
      throw new ValidationError(`User ${uid} is not a member of this group`);
    }
  }
}

function computeSplits(
  dto: CreateExpenseDto,
  splitResults: Array<{ userId: string; amount: number }>
): Array<{
  userId: Types.ObjectId;
  amount: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
}> {
  return splitResults.map((r) => {
    const participant = dto.splits?.find((s) => s.userId === r.userId);
    return {
      userId: new Types.ObjectId(r.userId),
      amount: r.amount,
      ...(dto.splitType === 'percentage' ? { percentage: participant?.value } : {}),
      ...(dto.splitType === 'shares' ? { shares: participant?.value } : {}),
      isPaid: r.userId === dto.paidBy,
    };
  });
}

function computeDebtDeltas(
  splitResults: Array<{ userId: string; amount: number }>,
  paidBy: string,
  groupId?: string
): DebtDelta[] {
  const deltas: DebtDelta[] = [];

  for (const split of splitResults) {
    if (split.userId === paidBy) continue; // payer doesn't owe themselves
    if (split.amount === 0) continue;

    // split.userId owes paidBy the split amount
    deltas.push({
      from: split.userId,
      to: paidBy,
      groupId,
      amount: split.amount,
    });
  }

  return deltas;
}

/**
 * Update debt documents by applying deltas (not full recompute).
 * Called inside the expense creation/edit/delete transaction.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateDebts(deltas: DebtDelta[], session: ClientSession): Promise<void> {
  // Lazy import Debt model to avoid circular dependency
  const { Debt } = await import('../settlements/settlement.model');

  for (const delta of deltas) {
    const filter = {
      from: new Types.ObjectId(delta.from),
      to: new Types.ObjectId(delta.to),
      ...(delta.groupId ? { groupId: new Types.ObjectId(delta.groupId) } : { groupId: null }),
    };

    // Use $inc — if debt reaches 0 or goes negative, handle reversal
    const existing = await Debt.findOne(filter, null, { session }).lean();

    if (!existing) {
      // Create new debt record
      await Debt.create(
        [
          {
            from: new Types.ObjectId(delta.from),
            to: new Types.ObjectId(delta.to),
            ...(delta.groupId ? { groupId: new Types.ObjectId(delta.groupId) } : {}),
            amount: delta.amount,
            lastUpdated: new Date(),
          },
        ],
        { session }
      );
    } else {
      const newAmount = existing.amount + delta.amount;
      if (newAmount > 0) {
        await Debt.updateOne(filter, { $set: { amount: newAmount, lastUpdated: new Date() } }, { session });
      } else if (newAmount === 0) {
        await Debt.deleteOne(filter, { session });
      } else {
        // Debt reversal — flip from/to
        await Debt.deleteOne(filter, { session });
        await Debt.create(
          [
            {
              from: new Types.ObjectId(delta.to),
              to: new Types.ObjectId(delta.from),
              ...(delta.groupId ? { groupId: new Types.ObjectId(delta.groupId) } : {}),
              amount: Math.abs(newAmount),
              lastUpdated: new Date(),
            },
          ],
          { session }
        );
      }
    }
  }
}

export async function createExpense(dto: CreateExpenseDto, actorId: string): Promise<IExpense> {
  const session = await mongoose.startSession();
  session.startTransaction();
  let expense: IExpense | null = null;

  try {
    // 1. Validate group membership for all involved parties
    const involvedUsers = [
      dto.paidBy,
      ...(dto.splits?.map((s) => s.userId) ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i);

    if (dto.groupId) {
      await validateGroupMembership(dto.groupId, [actorId, ...involvedUsers], session);
    }

    // 2. Compute splits
    const participants = dto.splits?.map((s) => ({ userId: s.userId, value: s.value } as SplitParticipant)) ?? [];
    const participantIds = dto.splits?.map((s) => s.userId) ?? involvedUsers;

    let splitResults: Array<{ userId: string; amount: number }>;
    switch (dto.splitType) {
      case 'equal':
        splitResults = computeEqualSplit(dto.amount, participantIds);
        break;
      case 'exact':
        splitResults = computeExactSplit(dto.amount, participants);
        break;
      case 'percentage':
        splitResults = computePercentageSplit(dto.amount, participants);
        break;
      case 'shares':
        splitResults = computeSharesSplit(dto.amount, participants);
        break;
      default:
        throw new ValidationError(`Invalid splitType: ${String(dto.splitType)}`);
    }

    // 3. Final guard
    validateSplitSum(splitResults, dto.amount);

    // 4. Create expense document
    const splits = computeSplits(dto, splitResults);
    const [newExpense] = await Expense.create(
      [
        {
          groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : undefined,
          description: dto.description,
          amount: dto.amount,
          paidBy: new Types.ObjectId(dto.paidBy),
          splitType: dto.splitType,
          splits,
          category: dto.category,
          tags: (dto.tags ?? []).slice(0, 10),
          date: dto.date ? new Date(dto.date) : new Date(),
          isRecurring: dto.isRecurring ?? false,
          recurringConfig: dto.recurringConfig
            ? {
                frequency: dto.recurringConfig.frequency,
                endDate: dto.recurringConfig.endDate ? new Date(dto.recurringConfig.endDate) : undefined,
                nextRunAt: new Date(dto.recurringConfig.nextRunAt),
              }
            : undefined,
          isDeleted: false,
          createdBy: new Types.ObjectId(actorId),
        },
      ],
      { session }
    );

    expense = newExpense!.toObject() as IExpense;

    // 5. Compute debt deltas & update debt records
    const debtDeltas = computeDebtDeltas(splitResults, dto.paidBy, dto.groupId);
    await updateDebts(debtDeltas, session);

    // 6. Write sync events for all involved users
    await writeSyncEventsForUsers(
      [...new Set([...participantIds, dto.paidBy])],
      {
        entityType: 'expense',
        entityId: String(expense._id),
        action: 'create',
        payload: expense,
      },
      session
    );

    // 7. Increment group cacheVersion
    if (dto.groupId) {
      await Group.updateOne(
        { _id: new Types.ObjectId(dto.groupId) },
        { $inc: { cacheVersion: 1 } },
        { session }
      );
    }

    await session.commitTransaction();

    // 8. Post-commit: invalidate caches, emit event, enqueue audit job
    if (dto.groupId) {
      await invalidateKeys(
        CacheKeys.groupBalances(dto.groupId),
        CacheKeys.simplifiedDebts(dto.groupId)
      );
    }

    eventBus.emit('expense.created', { expense, actor: { userId: actorId } });

    // Enqueue audit log (outside transaction)
    const auditQueue = await getAuditQueue();
    await auditQueue.add(
      'write',
      buildAuditJob({
        actorId,
        action: 'expense.create',
        entityType: 'expense',
        entityId: String(expense._id),
        groupId: dto.groupId,
        after: expense,
      })
    );

    log.info({ expenseId: expense._id, actorId }, 'Expense created');
    return expense;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function getExpenseById(expenseId: string, userId: string): Promise<IExpense> {
  const expense = await Expense.findOne({
    _id: new Types.ObjectId(expenseId),
    isDeleted: false,
  }).lean();

  if (!expense) throw new NotFoundError('Expense not found');

  // Authorization: user must have participated (paidBy or in splits)
  const splitUserIds = (expense.splits as Array<{ userId: Types.ObjectId }>).map((s) =>
    String(s.userId)
  );
  const isParticipant = String(expense.paidBy) === userId || splitUserIds.includes(userId);
  if (!isParticipant) throw new ForbiddenError('Access denied');

  return expense as IExpense;
}

export async function listGroupExpenses(
  groupId: string,
  userId: string,
  limit: number,
  cursor?: string
): Promise<PaginatedResult<IExpense>> {
  // Verify membership
  const group = await Group.findOne({
    _id: new Types.ObjectId(groupId),
    'members.userId': new Types.ObjectId(userId),
    isActive: true,
  }).lean();
  if (!group) throw new ForbiddenError('Not a member of this group');

  const cursorQuery = buildCursorQuery(cursor);
  const expenses = await Expense.find({
    groupId: new Types.ObjectId(groupId),
    isDeleted: false,
    ...cursorQuery,
  })
    .sort({ date: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildPaginatedResult(expenses as Array<IExpense & { date: Date }>, limit) as PaginatedResult<IExpense>;
}

export async function listPersonalExpenses(
  userId: string,
  limit: number,
  cursor?: string
): Promise<PaginatedResult<IExpense>> {
  const cursorQuery = buildCursorQuery(cursor);
  const expenses = await Expense.find({
    'splits.userId': new Types.ObjectId(userId),
    isDeleted: false,
    ...cursorQuery,
  })
    .sort({ date: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildPaginatedResult(expenses as Array<IExpense & { date: Date }>, limit) as PaginatedResult<IExpense>;
}

export async function softDeleteExpense(expenseId: string, actorId: string): Promise<void> {
  const expense = await Expense.findOne({ _id: new Types.ObjectId(expenseId), isDeleted: false }).lean();
  if (!expense) throw new NotFoundError('Expense not found');

  const splitUserIds = (expense.splits as Array<{ userId: Types.ObjectId }>).map((s) =>
    String(s.userId)
  );
  if (String(expense.createdBy) !== actorId && !splitUserIds.includes(actorId)) {
    throw new ForbiddenError('Access denied');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Expense.updateOne(
      { _id: new Types.ObjectId(expenseId) },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { session }
    );

    // Reverse debt deltas
    if (expense.groupId) {
      await Group.updateOne(
        { _id: expense.groupId },
        { $inc: { cacheVersion: 1 } },
        { session }
      );
    }

    await session.commitTransaction();

    if (expense.groupId) {
      await invalidateKeys(
        CacheKeys.groupBalances(String(expense.groupId)),
        CacheKeys.simplifiedDebts(String(expense.groupId))
      );
    }

    eventBus.emit('expense.deleted', { expense: expense as IExpense, actor: { userId: actorId } });
    log.info({ expenseId, actorId }, 'Expense soft-deleted');
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function addReceipt(
  expenseId: string,
  actorId: string,
  key: string
): Promise<IExpense> {
  const expense = await Expense.findOne({ _id: new Types.ObjectId(expenseId), isDeleted: false }).lean();
  if (!expense) throw new NotFoundError('Expense not found');

  if ((expense.receiptKeys as string[]).length >= 5) {
    throw new ValidationError('Maximum 5 receipts per expense');
  }

  const updated = await Expense.findOneAndUpdate(
    { _id: new Types.ObjectId(expenseId) },
    { $addToSet: { receiptKeys: key }, $set: { lastModifiedBy: new Types.ObjectId(actorId) } },
    { new: true }
  ).lean();

  if (!updated) throw new NotFoundError('Expense not found');
  return updated as IExpense;
}

export async function removeReceipt(
  expenseId: string,
  actorId: string,
  key: string
): Promise<void> {
  await Expense.updateOne(
    { _id: new Types.ObjectId(expenseId), isDeleted: false },
    { $pull: { receiptKeys: key }, $set: { lastModifiedBy: new Types.ObjectId(actorId) } }
  );
}
