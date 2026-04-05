import { redis } from '../../config/redis';

export const CacheKeys = {
  groupBalances: (groupId: string): string => `balances:${groupId}`,
  simplifiedDebts: (groupId: string): string => `simplified:${groupId}`,
  userGroups: (userId: string): string => `userGroups:${userId}`,
  syncCursor: (userId: string, deviceId: string): string => `cursor:${userId}:${deviceId}`,
  userSyncVersion: (userId: string): string => `user:${userId}:syncVersion`,
} as const;

/**
 * Generic cache-aside helper.
 * 1. Try Redis GET
 * 2. On miss: call fetchFn, store result in Redis with TTL, return result
 */
export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached !== null) {
    return JSON.parse(cached) as T;
  }
  const result = await fetchFn();
  await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
  return result;
}

/**
 * Invalidate one or more cache keys.
 */
export async function invalidateKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys);
}
