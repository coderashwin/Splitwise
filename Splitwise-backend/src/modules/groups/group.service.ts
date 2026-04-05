import { Types } from 'mongoose';
import { mongoose } from '../../config/database';
import { Group } from './group.model';
import { User } from '../users/user.model';
import { IGroup, CreateGroupDto, UpdateGroupDto } from './group.types';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ConflictError } from '../../shared/errors/ConflictError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { eventBus } from '../../shared/events/event-bus';
import { invalidateKeys, CacheKeys } from '../../shared/utils/cache';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('group.service');

const MAX_MEMBERS = 100;

export async function createGroup(creatorId: string, dto: CreateGroupDto): Promise<IGroup> {
  const members: Array<{ userId: Types.ObjectId; role: 'admin' | 'member'; joinedAt: Date }> = [
    { userId: new Types.ObjectId(creatorId), role: 'admin', joinedAt: new Date() },
  ];

  if (dto.memberIds && dto.memberIds.length > 0) {
    if (dto.memberIds.length + 1 > MAX_MEMBERS) {
      throw new ValidationError(`Group cannot have more than ${MAX_MEMBERS} members`);
    }
    for (const memberId of dto.memberIds) {
      if (memberId === creatorId) continue;
      const user = await User.findOne({ _id: new Types.ObjectId(memberId), isDeleted: false }).lean();
      if (!user) throw new NotFoundError(`User ${memberId} not found`);
      members.push({ userId: new Types.ObjectId(memberId), role: 'member' as const, joinedAt: new Date() });
    }
  }

  const group = await Group.create({
    name: dto.name,
    type: dto.type ?? 'other',
    imageKey: dto.imageKey,
    members,
    createdBy: new Types.ObjectId(creatorId),
    isActive: true,
    cacheVersion: 0,
  });

  log.info({ groupId: group._id, creatorId }, 'Group created');
  return group.toObject() as IGroup;
}

export async function getGroupById(groupId: string, userId: string): Promise<IGroup> {
  const group = await Group.findOne({
    _id: new Types.ObjectId(groupId),
    isActive: true,
    'members.userId': new Types.ObjectId(userId),
  }).lean();

  if (!group) throw new NotFoundError('Group not found');
  return group as IGroup;
}

export async function listUserGroups(userId: string): Promise<IGroup[]> {
  return Group.find({
    'members.userId': new Types.ObjectId(userId),
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .lean() as Promise<IGroup[]>;
}

function requireMember(group: IGroup, userId: string): void {
  const member = group.members.find((m) => String(m.userId) === userId);
  if (!member) throw new ForbiddenError('Not a member of this group');
}

function requireAdmin(group: IGroup, userId: string): void {
  const member = group.members.find((m) => String(m.userId) === userId);
  if (!member) throw new ForbiddenError('Not a member of this group');
  if (member.role !== 'admin') throw new ForbiddenError('Admin access required');
}

export async function updateGroup(
  groupId: string,
  userId: string,
  dto: UpdateGroupDto
): Promise<IGroup> {
  const group = await Group.findOne({ _id: new Types.ObjectId(groupId), isActive: true }).lean();
  if (!group) throw new NotFoundError('Group not found');
  requireAdmin(group as IGroup, userId);

  const updated = await Group.findOneAndUpdate(
    { _id: new Types.ObjectId(groupId) },
    {
      $set: { ...dto },
      $inc: { cacheVersion: 1 },
    },
    { new: true }
  ).lean();

  if (!updated) throw new NotFoundError('Group not found');
  await invalidateKeys(CacheKeys.userGroups(userId));
  log.info({ groupId }, 'Group updated');
  return updated as IGroup;
}

export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  const group = await Group.findOne({ _id: new Types.ObjectId(groupId), isActive: true }).lean();
  if (!group) throw new NotFoundError('Group not found');
  requireAdmin(group as IGroup, userId);

  await Group.updateOne({ _id: new Types.ObjectId(groupId) }, { $set: { isActive: false } });
  await invalidateKeys(
    CacheKeys.groupBalances(groupId),
    CacheKeys.simplifiedDebts(groupId)
  );
  eventBus.emit('group.deleted', { group: group as IGroup, actor: { userId } });
  log.info({ groupId }, 'Group soft-deleted');
}

export async function addMember(groupId: string, actorId: string, newUserId: string): Promise<IGroup> {
  const group = await Group.findOne({ _id: new Types.ObjectId(groupId), isActive: true }).lean();
  if (!group) throw new NotFoundError('Group not found');
  requireMember(group as IGroup, actorId);

  if ((group.members as IGroup['members']).length >= MAX_MEMBERS) {
    throw new ValidationError(`Group already has the maximum ${MAX_MEMBERS} members`);
  }

  const alreadyMember = (group.members as IGroup['members']).some((m) => String(m.userId) === newUserId);
  if (alreadyMember) throw new ConflictError('User is already a member of this group');

  const user = await User.findOne({ _id: new Types.ObjectId(newUserId), isDeleted: false }).lean();
  if (!user) throw new NotFoundError('User not found');

  const updated = await Group.findOneAndUpdate(
    { _id: new Types.ObjectId(groupId) },
    {
      $push: { members: { userId: new Types.ObjectId(newUserId), role: 'member' as const, joinedAt: new Date() } },
      $inc: { cacheVersion: 1 },
    },
    { new: true }
  ).lean();

  if (!updated) throw new NotFoundError('Group not found');

  eventBus.emit('group.invite', {
    group: updated as IGroup,
    invitee: { userId: newUserId },
    actor: { userId: actorId },
  });

  return updated as IGroup;
}

export async function removeMember(
  groupId: string,
  actorId: string,
  targetUserId: string
): Promise<void> {
  const group = await Group.findOne({ _id: new Types.ObjectId(groupId), isActive: true }).lean();
  if (!group) throw new NotFoundError('Group not found');

  const isSelf = actorId === targetUserId;
  if (isSelf) {
    requireMember(group as IGroup, actorId);
  } else {
    requireAdmin(group as IGroup, actorId);
  }

  await Group.updateOne(
    { _id: new Types.ObjectId(groupId) },
    {
      $pull: { members: { userId: new Types.ObjectId(targetUserId) } },
      $inc: { cacheVersion: 1 },
    }
  );
  await invalidateKeys(CacheKeys.userGroups(targetUserId));
  log.info({ groupId, actorId, targetUserId }, 'Member removed from group');
}

export async function verifyMembership(groupId: string, userId: string): Promise<boolean> {
  const group = await Group.findOne({
    _id: new Types.ObjectId(groupId),
    isActive: true,
    'members.userId': new Types.ObjectId(userId),
  })
    .select('_id')
    .lean();
  return group !== null;
}

export async function getMemberIds(groupId: string): Promise<string[]> {
  const group = await Group.findOne({ _id: new Types.ObjectId(groupId), isActive: true })
    .select('members')
    .lean();
  if (!group) throw new NotFoundError('Group not found');
  return (group.members as IGroup['members']).map((m) => String(m.userId));
}
