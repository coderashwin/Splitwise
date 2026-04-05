import { Worker, Job } from 'bullmq';
import type { messaging as AdminMessaging } from 'firebase-admin';
import { redisForBullMQ } from '../config/redis';
import { Notification } from '../modules/notifications/notification.model';
import { User } from '../modules/users/user.model';
import { getFirebaseMessaging } from '../config/fcm';
import { FcmJobData } from '../modules/notifications/notification.types';
import { IDevice } from '../modules/users/user.types';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('fcm.worker');

const STALE_DEVICE_DAYS = 30;
const staleThreshold = new Date(Date.now() - STALE_DEVICE_DAYS * 24 * 60 * 60 * 1000);

export function createFcmWorker(): Worker {
  return new Worker<FcmJobData>(
    'push:fcm',
    async (job: Job<FcmJobData>) => {
      const { recipientId, notificationId } = job.data;

      // Fetch notification
      const notification = await Notification.findById(notificationId).lean();
      if (!notification) {
        log.warn({ notificationId }, 'Notification not found, skipping FCM send');
        return;
      }

      // Fetch user devices
      const user = await User.findOne({ _id: recipientId, isDeleted: false }, { devices: 1 }).lean();
      if (!user || !user.devices || user.devices.length === 0) {
        log.info({ recipientId }, 'No devices found for user, skipping FCM send');
        return;
      }

      // Filter stale tokens
      const activeDevices = (user.devices as IDevice[]).filter(
        (d) => d.lastSeen > staleThreshold
      );

      if (activeDevices.length === 0) {
        log.info({ recipientId }, 'No active devices, skipping FCM send');
        return;
      }

      const tokens = activeDevices.map((d) => d.fcmToken);
      const messaging = getFirebaseMessaging();

      const payload = notification.payload as {
        title: string;
        body: string;
        imageUrl?: string;
      };

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        },
        data: {
          notificationId: String(notification._id),
          type: notification.type,
        },
      });

      log.info(
        { successCount: response.successCount, failureCount: response.failureCount, recipientId },
        'FCM multicast sent'
      );

      // Handle UNREGISTERED token errors — remove stale tokens
      const staleTokens: string[] = [];
      response.responses.forEach((resp: AdminMessaging.SendResponse, index: number) => {
        if (
          !resp.success &&
          resp.error?.code === 'messaging/registration-token-not-registered'
        ) {
          staleTokens.push(tokens[index] ?? '');
        }
      });

      if (staleTokens.length > 0) {
        await User.updateOne(
          { _id: recipientId },
          { $pull: { devices: { fcmToken: { $in: staleTokens } } } }
        );
        log.info({ count: staleTokens.length, recipientId }, 'Stale FCM tokens removed');
      }
    },
    {
      connection: redisForBullMQ,
      concurrency: 50,
    }
  );
}
