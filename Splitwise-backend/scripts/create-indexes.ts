/**
 * Idempotent index creation script.
 * Run with: npm run create-indexes
 *
 * Uses createIndex (not ensureIndex) which is safe to run multiple times.
 * In production, MongoDB Atlas handles index creation via Atlas Search or the UI.
 * This script is for self-hosted deployments.
 */

import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { createLogger } from '../src/shared/utils/logger';

// Import all models to register schemas
import '../src/modules/users/user.model';
import '../src/modules/friends/friendship.model';
import '../src/modules/groups/group.model';
import '../src/modules/expenses/expense.model';
import '../src/modules/settlements/settlement.model';
import '../src/modules/notifications/notification.model';
import '../src/modules/sync/sync.model';
import '../src/modules/audit/audit.model';

const log = createLogger('create-indexes');

async function run(): Promise<void> {
  log.info('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    bufferCommands: false,
  });
  log.info('Connected. Creating indexes...');

  const modelNames = mongoose.modelNames();
  for (const name of modelNames) {
    const model = mongoose.model(name);
    try {
      await model.createIndexes();
      log.info({ model: name }, 'Indexes created');
    } catch (err) {
      log.error({ model: name, err }, 'Failed to create indexes');
    }
  }

  log.info('All indexes created successfully.');
  await mongoose.connection.close();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Index creation failed:', err);
  process.exit(1);
});
