/**
 * Development data seeding script.
 * Run with: npm run seed
 *
 * Creates sample users, a group, and some expenses for local testing.
 * WARNING: This script drops existing data in development only.
 */

import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { env } from '../src/config/env';
import { createLogger } from '../src/shared/utils/logger';

// Import models
import { User } from '../src/modules/users/user.model';
import { Group } from '../src/modules/groups/group.model';
import { Expense } from '../src/modules/expenses/expense.model';
import { Debt } from '../src/modules/settlements/settlement.model';

const log = createLogger('seed');

if (env.NODE_ENV === 'production') {
  log.error('Refusing to seed in production environment!');
  process.exit(1);
}

async function seed(): Promise<void> {
  log.info('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    bufferCommands: false,
  });
  log.info('Connected. Seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Expense.deleteMany({}),
    Debt.deleteMany({}),
  ]);
  log.info('Cleared existing data');

  // Create users
  const [alice, bob, charlie] = await Promise.all([
    User.create({
      name: 'Alice',
      email: 'alice@example.com',
      oauthProviders: [{ provider: 'google', providerId: 'google_alice', email: 'alice@example.com' }],
      devices: [],
      friendIds: [],
      isDeleted: false,
    }),
    User.create({
      name: 'Bob',
      email: 'bob@example.com',
      oauthProviders: [{ provider: 'google', providerId: 'google_bob', email: 'bob@example.com' }],
      devices: [],
      friendIds: [],
      isDeleted: false,
    }),
    User.create({
      name: 'Charlie',
      email: 'charlie@example.com',
      oauthProviders: [{ provider: 'google', providerId: 'google_charlie', email: 'charlie@example.com' }],
      devices: [],
      friendIds: [],
      isDeleted: false,
    }),
  ]);

  log.info({ alice: alice._id, bob: bob._id, charlie: charlie._id }, 'Users created');

  // Create a group
  const group = await Group.create({
    name: 'Trip to Goa',
    type: 'trip',
    members: [
      { userId: alice._id, role: 'admin', joinedAt: new Date() },
      { userId: bob._id, role: 'member', joinedAt: new Date() },
      { userId: charlie._id, role: 'member', joinedAt: new Date() },
    ],
    createdBy: alice._id,
    isActive: true,
    cacheVersion: 0,
  });

  log.info({ groupId: group._id }, 'Group created');

  // Create an expense: Alice pays ₹3000 (300000 paise), split equally among 3
  const splitAmount = [100001, 100000, 99999]; // LRM: 300000 paise
  const expense = await Expense.create({
    groupId: group._id,
    description: 'Hotel booking',
    amount: 300000,
    paidBy: alice._id,
    splitType: 'equal',
    splits: [
      { userId: alice._id, amount: splitAmount[0], isPaid: true },
      { userId: bob._id, amount: splitAmount[1], isPaid: false },
      { userId: charlie._id, amount: splitAmount[2], isPaid: false },
    ],
    category: { name: 'Accommodation', icon: '🏨', color: '#4CAF50' },
    date: new Date(),
    isRecurring: false,
    isDeleted: false,
    createdBy: alice._id,
  });

  log.info({ expenseId: expense._id }, 'Expense created');

  // Create debt records reflecting the expense
  await Promise.all([
    Debt.create({
      from: bob._id,
      to: alice._id,
      groupId: group._id,
      amount: splitAmount[1],
      lastUpdated: new Date(),
    }),
    Debt.create({
      from: charlie._id,
      to: alice._id,
      groupId: group._id,
      amount: splitAmount[2],
      lastUpdated: new Date(),
    }),
  ]);

  log.info('Debt records created');
  log.info('Seed complete!');
  log.info({
    alice: { id: String(alice._id), email: alice.email },
    bob: { id: String(bob._id), email: bob.email },
    charlie: { id: String(charlie._id), email: charlie.email },
    group: { id: String(group._id), name: group.name },
  }, 'Seed data summary');

  await mongoose.connection.close();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
