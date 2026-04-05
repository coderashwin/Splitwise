import { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service';

export async function getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as Record<string, string>;
    const limit = Math.min(parseInt(query['limit'] ?? '20', 10) || 20, 100);
    const result = await notificationService.getNotificationFeed(req.user.userId, limit, query['cursor']);
    res.json({ ...result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAsRead(req.params['id'] ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ data: { count }, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}
