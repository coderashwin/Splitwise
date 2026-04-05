import mongoose from 'mongoose';
import { env } from './env';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('database');

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      bufferCommands: false,       // Fail fast if disconnected
      serverSelectionTimeoutMS: 5000,
    });
    log.info({ attempt }, 'MongoDB connected');
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      log.error({ err, attempt }, 'MongoDB connection failed after max retries');
      throw err;
    }
    const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
    log.warn({ attempt, delayMs }, 'MongoDB connection failed, retrying...');
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await connectWithRetry(attempt + 1);
  }
}

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('disconnected', () => {
    log.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    log.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err: unknown) => {
    log.error({ err }, 'MongoDB connection error');
  });

  await connectWithRetry();
}

export { mongoose };
