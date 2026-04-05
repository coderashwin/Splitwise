import { Types } from 'mongoose';
import { mongoose } from '../../config/database';
import { Settlement, Debt, ISettlement, IDebt } from './settlement.model';
import { RecordSettlementDto } from './settlement.types';
import { simplifyDebts, DebtEdge } from './debt-simplifier';
import { Group } from '../groups/group.model';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { eventBus } from '../../shared/events/event-bus';
import { getCached, invalidateKeys, CacheKeys } from '../../shared/utils/cache';
import { buildCursorQuery, buildPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { writeSyncEventsForUsers } from '../sync/sync.service';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('settlement.service');
const SIMPLIFIED_DEBT_TTL = 60; // 60 seconds

export async function recordSettlement(
  dto: RecordSettlementDto,
  actorId: string
): Promise<ISettlement> {
  // Validate group membership if groupId provided
  if (dto.groupId) {
    const group = await Group.findOne({
      _id: new Types.ObjectId(dto.groupId),
      isActive: true,
      'members.userId': { $all: [new Types.ObjectId(dto.from), new Types.ObjectId(dto.to)] },
    }).lean();
    if (!group) throw new ValidationError('Both users must be members of the group');
  }

  if (dto.amount < 1 || !Number.isInteger(dto.amount)) {
    throw new ValidationError('Settlement amount must be a positive integer (paise)');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  let settlement: ISettlement | null = null;

  try {
    const [newSettlement] = await Settlement.create(
      [
        {
          from: new Types.ObjectId(dto.from),
          to: new Types.ObjectId(dto.to),
          amount: dto.amount,
          groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : undefined,
          note: dto.note,
          status: 'pending_confirmation',
          createdBy: new Types.ObjectId(actorId),
        },
      ],
      { session }
    );

    settlement = newSettlement!.toObject() as ISettlement;

    // Update debt: reduce from→to debt by settlement amount
    const filter = {
      from: new Types.ObjectId(dto.from),
      to: new Types.ObjectId(dto.to),
      ...(dto.groupId ? { groupId: new Types.ObjectId(dto.groupId) } : { groupId: null }),
    };

    const existingDebt = await Debt.findOne(filter, null, { session }).lean();

    if (existingDebt) {
      const newAmount = existingDebt.amount - dto.amount;
      if (newAmount > 0) {
        await Debt.updateOne(filter, { $set: { amount: newAmount, lastUpdated: new Date() } }, { session });
      } else if (newAmount === 0) {
        await Debt.deleteOne(filter, { session });
      } else {
        // Overpayment — debt reversal
        await Debt.deleteOne(filter, { session });
        await Debt.create(
          [
            {
              from: new Types.ObjectId(dto.to),
              to: new Types.ObjectId(dto.from),
              ...(dto.groupId ? { groupId: new Types.ObjectId(dto.groupId) } : {}),
              amount: Math.abs(newAmount),
              lastUpdated: new Date(),
            },
          ],
          { session }
        );
      }
    }

    // Write sync events for both parties
    await writeSyncEventsForUsers(
      [dto.from, dto.to],
      { entityType: 'settlement', entityId: String(settlement._id), action: 'create', payload: settlement },
      session
    );

    await session.commitTransaction();

    // Post-commit
    if (dto.groupId) {
      await invalidateKeys(
        CacheKeys.groupBalances(dto.groupId),
        CacheKeys.simplifiedDebts(dto.groupId)
      );
    }

    eventBus.emit('settlement.recorded', { settlement, actor: { userId: actorId } });
    log.info({ settlementId: settlement._id, actorId }, 'Settlement recorded');
    return settlement;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function confirmSettlement(settlementId: string, userId: string): Promise<ISettlement> {
  const settlement = await Settlement.findById(settlementId).lean();
  if (!settlement) throw new NotFoundError('Settlement not found');

  if (String(settlement.to) !== userId) {
    throw new ForbiddenError('Only the recipient can confirm a settlement');
  }

  if (settlement.status === 'confirmed') {
    throw new ValidationError('Settlement already confirmed');
  }

  const updated = await Settlement.findOneAndUpdate(
    { _id: new Types.ObjectId(settlementId) },
    { $set: { status: 'confirmed', confirmedAt: new Date() } },
    { new: true }
  ).lean();

  if (!updated) throw new NotFoundError('Settlement not found');

  eventBus.emit('settlement.confirmed', { settlement: updated as ISettlement, actor: { userId } });
  return updated as ISettlement;
}

export async function getGroupSettlements(
  groupId: string,
  userId: string,
  limit: number,
  cursor?: string
): Promise<PaginatedResult<ISettlement>> {
  const isMember = await Group.findOne({
    _id: new Types.ObjectId(groupId),
    'members.userId': new Types.ObjectId(userId),
    isActive: true,
  }).lean();
  if (!isMember) throw new ForbiddenError('Not a member of this group');

  const cursorQuery = buildCursorQuery(cursor);
  const settlements = await Settlement.find({
    groupId: new Types.ObjectId(groupId),
    ...cursorQuery,
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildPaginatedResult(
    settlements.map((s) => ({ ...s, date: s.createdAt })) as Array<ISettlement & { date: Date }>,
    limit
  ) as PaginatedResult<ISettlement>;
}

export async function getPersonalSettlements(
  userId: string,
  limit: number,
  cursor?: string
): Promise<PaginatedResult<ISettlement>> {
  const cursorQuery = buildCursorQuery(cursor);
  const settlements = await Settlement.find({
    $or: [{ from: new Types.ObjectId(userId) }, { to: new Types.ObjectId(userId) }],
    ...cursorQuery,
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildPaginatedResult(
    settlements.map((s) => ({ ...s, date: s.createdAt })) as Array<ISettlement & { date: Date }>,
    limit
  ) as PaginatedResult<ISettlement>;
}

export async function getSimplifiedDebts(groupId: string, userId: string): Promise<DebtEdge[]> {
  const isMember = await Group.findOne({
    _id: new Types.ObjectId(groupId),
    'members.userId': new Types.ObjectId(userId),
    isActive: true,
  }).lean();
  if (!isMember) throw new ForbiddenError('Not a member of this group');

  return getCached(
    CacheKeys.simplifiedDebts(groupId),
    SIMPLIFIED_DEBT_TTL,
    async () => {
      const rawDebts = await Debt.find({ groupId: new Types.ObjectId(groupId) }).lean();
      const edges: DebtEdge[] = rawDebts.map((d) => ({
        from: String((d as IDebt).from),
        to: String((d as IDebt).to),
        amount: (d as IDebt).amount,
        groupId,
      }));
      return simplifyDebts(edges);
    }
  );
}

export async function getGroupBalances(
  groupId: string,
  userId: string
): Promise<Array<{ userId: string; owes: number; owed: number; net: number }>> {
  const isMember = await Group.findOne({
    _id: new Types.ObjectId(groupId),
    'members.userId': new Types.ObjectId(userId),
    isActive: true,
  }).lean();
  if (!isMember) throw new ForbiddenError('Not a member of this group');

  return getCached(
    CacheKeys.groupBalances(groupId),
    SIMPLIFIED_DEBT_TTL,
    async () => {
      const debts = await Debt.find({ groupId: new Types.ObjectId(groupId) }).lean();
      const balanceMap = new Map<string, { owes: number; owed: number }>();

      for (const debt of debts) {
        const d = debt as IDebt;
        const fromId = String(d.from);
        const toId = String(d.to);

        if (!balanceMap.has(fromId)) balanceMap.set(fromId, { owes: 0, owed: 0 });
        if (!balanceMap.has(toId)) balanceMap.set(toId, { owes: 0, owed: 0 });

        balanceMap.get(fromId)!.owes += d.amount;
        balanceMap.get(toId)!.owed += d.amount;
      }

      return Array.from(balanceMap.entries()).map(([uid, b]) => ({
        userId: uid,
        owes: b.owes,
        owed: b.owed,
        net: b.owed - b.owes,
      }));
    }
  );
}
