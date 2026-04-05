import Redis from 'ioredis';
import { env } from './env';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('redis');

function createRedisClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    reconnectOnError: (err: Error) => {
      log.warn({ err: err.message, name }, 'Redis reconnecting on error');
      return true; // Always reconnect
    },
    enableReadyCheck: true,
  });

  client.on('connect', () => log.info({ name }, 'Redis connecting'));
  client.on('ready', () => log.info({ name }, 'Redis ready'));
  client.on('error', (err: unknown) => log.error({ err, name }, 'Redis error'));
  client.on('close', () => log.warn({ name }, 'Redis connection closed'));
  client.on('reconnecting', () => log.warn({ name }, 'Redis reconnecting'));

  return client;
}

// Main Redis client — used for caching, rate limiting, refresh tokens
export const redis = createRedisClient('main');

// Separate Redis client for BullMQ — BullMQ requires its own connection
export const redisForBullMQ = createRedisClient('bullmq');

export async function connectRedis(): Promise<void> {
  await redis.connect();
  await redisForBullMQ.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  await redisForBullMQ.quit();
}
