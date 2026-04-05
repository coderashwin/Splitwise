import { Request, Response, NextFunction } from 'express';
import * as groupService from './group.service';

export async function createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.createGroup(req.user.userId, req.body as Parameters<typeof groupService.createGroup>[1]);
    res.status(201).json({ data: group, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function listGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await groupService.listUserGroups(req.user.userId);
    res.json({ data: groups, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function getGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.getGroupById(req.params['id'] ?? '', req.user.userId);
    res.json({ data: group, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.updateGroup(req.params['id'] ?? '', req.user.userId, req.body as Parameters<typeof groupService.updateGroup>[2]);
    res.json({ data: group, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await groupService.deleteGroup(req.params['id'] ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.body as { userId: string };
    const group = await groupService.addMember(req.params['id'] ?? '', req.user.userId, userId);
    res.status(201).json({ data: group, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await groupService.removeMember(req.params['id'] ?? '', req.user.userId, req.params['userId'] ?? '');
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function leaveGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await groupService.removeMember(req.params['id'] ?? '', req.user.userId, req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}
