import { Request, Response, NextFunction } from 'express';
import * as friendshipService from './friendship.service';

export async function sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const friendship = await friendshipService.sendFriendRequest(
      req.user.userId,
      req.params['userId'] ?? ''
    );
    res.status(201).json({ data: friendship, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const friendship = await friendshipService.acceptFriendRequest(
      req.params['id'] ?? '',
      req.user.userId
    );
    res.json({ data: friendship, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await friendshipService.rejectFriendRequest(req.params['id'] ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function unfriend(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await friendshipService.unfriend(req.user.userId, req.params['userId'] ?? '');
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function listFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(Number((req.query as Record<string, unknown>)['limit'] ?? 20), 100);
    const cursor = (req.query as Record<string, unknown>)['cursor'] as string | undefined;
    const result = await friendshipService.listFriends(req.user.userId, limit, cursor);
    res.json({ ...result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function listPendingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requests = await friendshipService.listPendingRequests(req.user.userId);
    res.json({ data: requests, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await friendshipService.blockUser(req.user.userId, req.params['userId'] ?? '');
    res.status(204).send();
  } catch (err) { next(err); }
}
