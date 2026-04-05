import { Types, ClientSession } from 'mongoose';
import { SyncEvent, ISyncEvent } from './sync.model';
import { redis } from '../../config/redis';
import { CacheKeys } from '../../shared/utils/cache';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('sync.service');
const MAX_EVENTS_PER_CALL = 500;

export async function getNextVersion(userId: string): Promise<number> {
  const version = await redis.incr(CacheKeys.userSyncVersion(userId));
  return version;
}

export async function writeSyncEvent(
  params: {
    userId: string;
    entityType: ISyncEvent['entityType'];
    entityId: string;
    action: ISyncEvent['action'];
    payload?: unknown;
  },
  session?: ClientSession
): Promise<void> {
  const version = await getNextVersion(params.userId);
  const docs: Partial<ISyncEvent>[] = [
    {
      userId: new Types.ObjectId(params.userId),
      entityType: params.entityType,
      entityId: new Types.ObjectId(params.entityId),
      action: params.action,
      version,
      payload: params.payload,
      createdAt: new Date(),
    },
  ];

  await SyncEvent.insertMany(docs, { session });
}

/**
 * Write sync events for multiple users in the same transaction session.
 */
export async function writeSyncEventsForUsers(
  userIds: string[],
  params: Omit<Parameters<typeof writeSyncEvent>[0], 'userId'>,
  session?: ClientSession
): Promise<void> {
  for (const userId of userIds) {
    await writeSyncEvent({ userId, ...params }, session);
  }
}

export async function getSyncDelta(
  userId: string,
  sinceVersion: number,
  deviceId: string
): Promise<{
  events: ISyncEvent[];
  hasMore: boolean;
  maxVersion: number;
}> {
  const events = await SyncEvent.find({
    userId: new Types.ObjectId(userId),
    version: { $gt: sinceVersion },
  })
    .sort({ version: 1 })
    .limit(MAX_EVENTS_PER_CALL + 1)
    .lean();

  const hasMore = events.length === MAX_EVENTS_PER_CALL + 1;
  const data = hasMore ? events.slice(0, MAX_EVENTS_PER_CALL) : events;
  const maxVersion = data.length > 0 ? Math.max(...data.map((e) => e.version)) : sinceVersion;

  // Store latest served cursor
  await redis.set(CacheKeys.syncCursor(userId, deviceId), String(maxVersion));

  log.info({ userId, sinceVersion, count: data.length, hasMore }, 'Sync delta fetched');
  return { events: data as ISyncEvent[], hasMore, maxVersion };
}
