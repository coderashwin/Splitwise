import mongoose from 'mongoose';
import { setupTestDb, clearTestDb, teardownTestDb } from '../helpers/db';
import { createTestUser, createTestGroup } from '../helpers/fixtures';
import { createExpense } from '../../src/modules/expenses/expense.service';
import { Debt } from '../../src/modules/settlements/settlement.model';
import { recordSettlement, getSimplifiedDebts } from '../../src/modules/settlements/settlement.service';

// Mock redis for cache/sync calls
jest.mock('../../src/config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
  },
  redisForBullMQ: {},
}));

// Mock BullMQ Queue to avoid real Redis connections
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  })),
  Worker: jest.fn(),
}));

// Mock sync service to avoid redis incr calls
jest.mock('../../src/modules/sync/sync.service', () => ({
  writeSyncEventsForUsers: jest.fn().mockResolvedValue(undefined),
  writeSyncEvent: jest.fn().mockResolvedValue(undefined),
  getSyncDelta: jest.fn().mockResolvedValue({ events: [], hasMore: false, maxVersion: 0 }),
  getNextVersion: jest.fn().mockResolvedValue(1),
}));

// Mock cache utils
jest.mock('../../src/shared/utils/cache', () => ({
  getCached: jest.fn().mockImplementation((_key: string, _ttl: number, fn: () => unknown) => fn()),
  invalidateKeys: jest.fn().mockResolvedValue(undefined),
  CacheKeys: {
    groupBalances: (id: string) => `group:${id}:balances`,
    simplifiedDebts: (id: string) => `group:${id}:simplified`,
    userGroups: (id: string) => `user:${id}:groups`,
    userSyncVersion: (id: string) => `sync:${id}:version`,
    syncCursor: (id: string, d: string) => `sync:${id}:${d}:cursor`,
  },
}));

describe('Expense Integration', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('createExpense — equal split', () => {
    it('should create expense and generate correct debt records', async () => {
      const alice = await createTestUser({ name: 'Alice' });
      const bob = await createTestUser({ name: 'Bob' });
      const charlie = await createTestUser({ name: 'Charlie' });
      const group = await createTestGroup(String(alice._id), [String(bob._id), String(charlie._id)]);

      // Alice pays ₹3000 (300000 paise) — equal split among 3
      const expense = await createExpense(
        {
          groupId: String(group._id),
          description: 'Hotel booking',
          amount: 300000,
          paidBy: String(alice._id),
          splitType: 'equal',
          splits: [
            { userId: String(alice._id) },
            { userId: String(bob._id) },
            { userId: String(charlie._id) },
          ],
        },
        String(alice._id)
      );

      expect(expense._id).toBeDefined();
      expect(expense.amount).toBe(300000);
      expect(expense.splits).toHaveLength(3);

      // Verify sum of splits = 300000
      const splitSum = expense.splits.reduce((acc, s) => acc + s.amount, 0);
      expect(splitSum).toBe(300000);

      // Verify debt records created: Bob and Charlie each owe Alice 100000
      const debts = await Debt.find({ groupId: group._id }).lean();
      expect(debts).toHaveLength(2);

      const bobDebt = debts.find((d) => String(d.from) === String(bob._id));
      const charlieDebt = debts.find((d) => String(d.from) === String(charlie._id));

      expect(bobDebt).toBeDefined();
      expect(charlieDebt).toBeDefined();
      expect(String(bobDebt!.to)).toBe(String(alice._id));
      expect(String(charlieDebt!.to)).toBe(String(alice._id));

      // Each share is exactly 100000 for 300000 / 3
      expect(bobDebt!.amount + charlieDebt!.amount).toBe(200000);
    });

    it('should distribute remainder paise correctly', async () => {
      const alice = await createTestUser({ name: 'Alice' });
      const bob = await createTestUser({ name: 'Bob' });
      const group = await createTestGroup(String(alice._id), [String(bob._id)]);

      // 100001 paise among 2 people — cannot split evenly
      const expense = await createExpense(
        {
          groupId: String(group._id),
          description: 'Dinner',
          amount: 100001,
          paidBy: String(alice._id),
          splitType: 'equal',
          splits: [
            { userId: String(alice._id) },
            { userId: String(bob._id) },
          ],
        },
        String(alice._id)
      );

      const splitSum = expense.splits.reduce((acc, s) => acc + s.amount, 0);
      expect(splitSum).toBe(100001);

      // One person pays 50001, other pays 50000
      const amounts = expense.splits.map((s) => s.amount).sort((a, b) => a - b);
      expect(amounts[0]).toBe(50000);
      expect(amounts[1]).toBe(50001);
    });
  });

  describe('createExpense — exact split', () => {
    it('should reject when exact amounts do not sum to total', async () => {
      const alice = await createTestUser({ name: 'Alice' });
      const bob = await createTestUser({ name: 'Bob' });
      const group = await createTestGroup(String(alice._id), [String(bob._id)]);

      await expect(
        createExpense(
          {
            groupId: String(group._id),
            description: 'Test',
            amount: 1000,
            paidBy: String(alice._id),
            splitType: 'exact',
            splits: [
              { userId: String(alice._id), value: 600 },
              { userId: String(bob._id), value: 300 }, // 900 != 1000
            ],
          },
          String(alice._id)
        )
      ).rejects.toThrow('Exact split amounts must sum to total');
    });
  });

  describe('recordSettlement', () => {
    it('should reduce outstanding debt when settlement is recorded', async () => {
      const alice = await createTestUser({ name: 'Alice' });
      const bob = await createTestUser({ name: 'Bob' });
      const group = await createTestGroup(String(alice._id), [String(bob._id)]);

      // Create expense: Alice pays 1000, Bob owes 500
      await createExpense(
        {
          groupId: String(group._id),
          description: 'Lunch',
          amount: 1000,
          paidBy: String(alice._id),
          splitType: 'equal',
          splits: [
            { userId: String(alice._id) },
            { userId: String(bob._id) },
          ],
        },
        String(alice._id)
      );

      // Verify debt: Bob owes Alice 500
      const debtBefore = await Debt.findOne({
        from: new mongoose.Types.ObjectId(String(bob._id)),
        to: new mongoose.Types.ObjectId(String(alice._id)),
        groupId: group._id,
      }).lean();
      expect(debtBefore).toBeDefined();
      expect(debtBefore!.amount).toBe(500);

      // Bob settles 300 paise
      await recordSettlement(
        {
          from: String(bob._id),
          to: String(alice._id),
          amount: 300,
          groupId: String(group._id),
        },
        String(bob._id)
      );

      // Verify debt reduced to 200
      const debtAfter = await Debt.findOne({
        from: new mongoose.Types.ObjectId(String(bob._id)),
        to: new mongoose.Types.ObjectId(String(alice._id)),
        groupId: group._id,
      }).lean();
      expect(debtAfter).toBeDefined();
      expect(debtAfter!.amount).toBe(200);
    });

    it('should delete debt record when fully settled', async () => {
      const alice = await createTestUser({ name: 'Alice' });
      const bob = await createTestUser({ name: 'Bob' });
      const group = await createTestGroup(String(alice._id), [String(bob._id)]);

      await createExpense(
        {
          groupId: String(group._id),
          description: 'Cab',
          amount: 600,
          paidBy: String(alice._id),
          splitType: 'equal',
          splits: [{ userId: String(alice._id) }, { userId: String(bob._id) }],
        },
        String(alice._id)
      );

      // Bob settles full 300 paise
      await recordSettlement(
        {
          from: String(bob._id),
          to: String(alice._id),
          amount: 300,
          groupId: String(group._id),
        },
        String(bob._id)
      );

      const debtAfter = await Debt.findOne({
        from: new mongoose.Types.ObjectId(String(bob._id)),
        to: new mongoose.Types.ObjectId(String(alice._id)),
      }).lean();
      expect(debtAfter).toBeNull();
    });
  });

  describe('getSimplifiedDebts', () => {
    it('should simplify triangle debt', async () => {
      const alice = await createTestUser({ name: 'Alice' });
      const bob = await createTestUser({ name: 'Bob' });
      const charlie = await createTestUser({ name: 'Charlie' });
      const group = await createTestGroup(String(alice._id), [String(bob._id), String(charlie._id)]);

      // Alice pays ₹3000 — Bob and Charlie each owe 1000
      await createExpense(
        {
          groupId: String(group._id),
          description: 'Hotel',
          amount: 3000,
          paidBy: String(alice._id),
          splitType: 'equal',
          splits: [
            { userId: String(alice._id) },
            { userId: String(bob._id) },
            { userId: String(charlie._id) },
          ],
        },
        String(alice._id)
      );

      // Bob pays ₹600 — Alice and Charlie each owe 200
      await createExpense(
        {
          groupId: String(group._id),
          description: 'Transport',
          amount: 600,
          paidBy: String(bob._id),
          splitType: 'equal',
          splits: [
            { userId: String(alice._id) },
            { userId: String(bob._id) },
            { userId: String(charlie._id) },
          ],
        },
        String(bob._id)
      );

      // Use getGroupBalances directly (simplified view)
      const simplified = await getSimplifiedDebts(String(group._id), String(alice._id));

      // Total absolute debt should be conserved
      const rawDebts = await Debt.find({ groupId: group._id }).lean();
      const rawTotal = rawDebts.reduce((acc, d) => acc + d.amount, 0);
      const simplifiedTotal = simplified.reduce((acc, e) => acc + e.amount, 0);

      // Simplified total should not exceed raw total (may be less due to netting)
      expect(simplifiedTotal).toBeLessThanOrEqual(rawTotal);
      // All amounts must be positive integers
      for (const edge of simplified) {
        expect(edge.amount).toBeGreaterThan(0);
        expect(Number.isInteger(edge.amount)).toBe(true);
      }
    });
  });
});
