import { Types } from 'mongoose';
import { Queue } from 'bullmq';
import { Notification, INotification } from './notification.model';
import { NotificationType, NotificationPayload, FcmJobData } from './notification.types';
import { eventBus } from '../../shared/events/event-bus';
import { redisForBullMQ } from '../../config/redis';
import { buildCursorQuery, buildPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('notification.service');

let fcmQueue: Queue | null = null;

function getFcmQueue(): Queue {
  if (!fcmQueue) {
    fcmQueue = new Queue('push:fcm', {
      connection: redisForBullMQ,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
  }
  return fcmQueue;
}

async function createAndEnqueueNotification(
  recipientId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<void> {
  const notification = await Notification.create({
    recipientId: new Types.ObjectId(recipientId),
    type,
    payload,
    isRead: false,
    createdAt: new Date(),
  });

  const jobData: FcmJobData = {
    recipientId,
    notificationId: String(notification._id),
  };

  await getFcmQueue().add('send', jobData);
}

async function createBulkNotifications(
  recipientIds: string[],
  type: NotificationType,
  payload: NotificationPayload
): Promise<void> {
  const docs = recipientIds.map((id) => ({
    recipientId: new Types.ObjectId(id),
    type,
    payload,
    isRead: false,
    createdAt: new Date(),
  }));

  const created = await Notification.insertMany(docs);

  const queue = getFcmQueue();
  for (const notif of created) {
    await queue.add('send', {
      recipientId: String(notif.recipientId),
      notificationId: String(notif._id),
    } as FcmJobData);
  }
}

// ============================================================
// Event listeners — registered once on app startup
// ============================================================

function onExpenseCreated(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const expense = payload['expense'] as { _id: unknown; groupId?: unknown; splits?: Array<{ userId: unknown }>; paidBy: unknown; description?: string };
      const actor = payload['actor'] as { userId: string };
      const splits = expense.splits ?? [];
      const recipientIds = splits
        .map((s) => String(s.userId))
        .filter((id) => id !== actor.userId);

      if (recipientIds.length === 0) return;

      await createBulkNotifications(recipientIds, 'EXPENSE_ADDED', {
        title: 'New expense added',
        body: `${actor.userId} added an expense`,
        expenseId: new Types.ObjectId(String(expense._id)),
        groupId: expense.groupId ? new Types.ObjectId(String(expense.groupId)) : undefined,
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling expense.created event');
    }
  })();
}

function onExpenseDeleted(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const expense = payload['expense'] as { _id: unknown; groupId?: unknown; splits?: Array<{ userId: unknown }>; paidBy: unknown };
      const actor = payload['actor'] as { userId: string };
      const splits = expense.splits ?? [];
      const recipientIds = splits
        .map((s) => String(s.userId))
        .filter((id) => id !== actor.userId);

      if (recipientIds.length === 0) return;

      await createBulkNotifications(recipientIds, 'EXPENSE_DELETED', {
        title: 'Expense deleted',
        body: `An expense was deleted`,
        expenseId: new Types.ObjectId(String(expense._id)),
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling expense.deleted event');
    }
  })();
}

function onSettlementRecorded(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const settlement = payload['settlement'] as { _id: unknown; from: unknown; to: unknown; amount: number; groupId?: unknown };
      const actor = payload['actor'] as { userId: string };
      const recipientId = String(settlement.to);

      if (recipientId === actor.userId) return;

      await createAndEnqueueNotification(recipientId, 'SETTLEMENT_RECORDED', {
        title: 'Payment recorded',
        body: `${actor.userId} recorded a payment of ${settlement.amount} paise`,
        settlementId: new Types.ObjectId(String(settlement._id)),
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling settlement.recorded event');
    }
  })();
}

function onSettlementConfirmed(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const settlement = payload['settlement'] as { _id: unknown; from: unknown; to: unknown };
      const actor = payload['actor'] as { userId: string };
      const recipientId = String(settlement.from);

      if (recipientId === actor.userId) return;

      await createAndEnqueueNotification(recipientId, 'SETTLEMENT_CONFIRMED', {
        title: 'Payment confirmed',
        body: 'Your payment was confirmed',
        settlementId: new Types.ObjectId(String(settlement._id)),
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling settlement.confirmed event');
    }
  })();
}

function onFriendRequestSent(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const friendship = payload['friendship'] as { recipient: unknown };
      const actor = payload['actor'] as { userId: string };
      const recipientId = String(friendship.recipient);

      await createAndEnqueueNotification(recipientId, 'FRIEND_REQUEST', {
        title: 'New friend request',
        body: `Someone sent you a friend request`,
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling friend.request.sent event');
    }
  })();
}

function onFriendAccepted(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const friendship = payload['friendship'] as { requester: unknown };
      const actor = payload['actor'] as { userId: string };
      const recipientId = String(friendship.requester);

      await createAndEnqueueNotification(recipientId, 'FRIEND_ACCEPTED', {
        title: 'Friend request accepted',
        body: 'Your friend request was accepted',
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling friend.accepted event');
    }
  })();
}

function onGroupInvite(payload: Record<string, unknown>): void {
  void (async (): Promise<void> => {
    try {
      const group = payload['group'] as { _id: unknown; name: string };
      const invitee = payload['invitee'] as { userId: string };
      const actor = payload['actor'] as { userId: string };

      await createAndEnqueueNotification(invitee.userId, 'GROUP_INVITE', {
        title: 'Added to a group',
        body: `You were added to ${group.name}`,
        groupId: new Types.ObjectId(String(group._id)),
        actorId: new Types.ObjectId(actor.userId),
      });
    } catch (err) {
      log.error({ err }, 'Error handling group.invite event');
    }
  })();
}

/**
 * Register all event bus listeners — call once in app startup.
 */
export function registerEventListeners(): void {
  eventBus.on('expense.created', onExpenseCreated);
  eventBus.on('expense.deleted', onExpenseDeleted);
  eventBus.on('settlement.recorded', onSettlementRecorded);
  eventBus.on('settlement.confirmed', onSettlementConfirmed);
  eventBus.on('friend.request.sent', onFriendRequestSent);
  eventBus.on('friend.accepted', onFriendAccepted);
  eventBus.on('group.invite', onGroupInvite);
  log.info('Notification event listeners registered');
}

// ============================================================
// CRUD operations
// ============================================================

export async function getNotificationFeed(
  userId: string,
  limit: number,
  cursor?: string
): Promise<PaginatedResult<INotification>> {
  const cursorQuery = buildCursorQuery(cursor);
  const notifications = await Notification.find({
    recipientId: new Types.ObjectId(userId),
    ...cursorQuery,
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildPaginatedResult(
    notifications.map((n) => ({ ...n, date: n.createdAt })) as Array<INotification & { date: Date }>,
    limit
  ) as PaginatedResult<INotification>;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const result = await Notification.updateOne(
    { _id: new Types.ObjectId(notificationId), recipientId: new Types.ObjectId(userId) },
    { $set: { isRead: true, readAt: new Date() } }
  );
  if (result.matchedCount === 0) throw new NotFoundError('Notification not found');
}

export async function markAllAsRead(userId: string): Promise<void> {
  await Notification.updateMany(
    { recipientId: new Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({
    recipientId: new Types.ObjectId(userId),
    isRead: false,
  });
}
