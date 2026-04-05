import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.json({ data: user, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await userService.updateUser(req.user.userId, req.body as { name?: string; avatarKey?: string });
    res.json({ data: updated, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteAccount(req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserPublicProfile(req.params['id'] ?? '');
    res.json({ data: user, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = String((req.query as Record<string, unknown>)['q'] ?? '');
    const results = await userService.searchUsers(q, req.user.userId);
    res.json({ data: results, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.registerDevice(req.user.userId, req.body as { fcmToken: string; platform: 'android' | 'ios' });
    res.status(201).json({ data: { success: true }, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function unregisterDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.unregisterDevice(req.user.userId, req.params['fcmToken'] ?? '');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
