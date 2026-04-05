import { Types } from 'mongoose';
import { User } from './user.model';
import { IUser, IUserPublic, UpdateUserDto, RegisterDeviceDto } from './user.types';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ConflictError } from '../../shared/errors/ConflictError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { eventBus } from '../../shared/events/event-bus';
import { env } from '../../config/env';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('user.service');

const MAX_DEVICES = 5;
const CLOUDFRONT_URL = env.CLOUDFRONT_URL;

export function getAvatarUrl(avatarKey: string | undefined): string | undefined {
  if (!avatarKey) return undefined;
  return `${CLOUDFRONT_URL}/${avatarKey}`;
}

export async function getUserById(userId: string): Promise<IUser> {
  const user = await User.findOne({
    _id: new Types.ObjectId(userId),
    isDeleted: false,
  }).lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user as IUser;
}

export async function getUserPublicProfile(userId: string): Promise<IUserPublic> {
  const user = await User.findOne(
    { _id: new Types.ObjectId(userId), isDeleted: false },
    { name: 1, avatarKey: 1 }
  ).lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    _id: String(user._id),
    name: user.name,
    avatarUrl: getAvatarUrl(user.avatarKey),
  };
}

export async function updateUser(userId: string, dto: UpdateUserDto): Promise<IUser> {
  const updateFields: Partial<IUser> = {};
  if (dto.name !== undefined) updateFields.name = dto.name;
  if (dto.avatarKey !== undefined) updateFields.avatarKey = dto.avatarKey;

  const updated = await User.findOneAndUpdate(
    { _id: new Types.ObjectId(userId), isDeleted: false },
    { $set: updateFields },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError('User not found');
  }

  log.info({ userId }, 'User profile updated');
  return updated as IUser;
}

export async function searchUsers(q: string, requestingUserId: string): Promise<IUserPublic[]> {
  if (q.trim().length === 0) {
    throw new ValidationError('Search query cannot be empty');
  }

  const users = await User.find(
    {
      $text: { $search: q },
      isDeleted: false,
      _id: { $ne: new Types.ObjectId(requestingUserId) },
    },
    { name: 1, avatarKey: 1, score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .lean();

  return users.map((u) => ({
    _id: String(u._id),
    name: u.name,
    avatarUrl: getAvatarUrl(u.avatarKey),
  }));
}

export async function registerDevice(userId: string, dto: RegisterDeviceDto): Promise<void> {
  const user = await User.findOne({ _id: new Types.ObjectId(userId), isDeleted: false });
  if (!user) throw new NotFoundError('User not found');

  // Update lastSeen if token exists, otherwise add new device
  const existingDeviceIndex = user.devices.findIndex((d) => d.fcmToken === dto.fcmToken);

  if (existingDeviceIndex >= 0) {
    user.devices[existingDeviceIndex]!.lastSeen = new Date();
  } else {
    if (user.devices.length >= MAX_DEVICES) {
      // Remove the oldest device
      const oldest = user.devices.sort((a, b) => a.lastSeen.getTime() - b.lastSeen.getTime())[0];
      if (oldest) {
        user.devices = user.devices.filter((d) => d.fcmToken !== oldest.fcmToken);
      }
    }
    user.devices.push({ fcmToken: dto.fcmToken, platform: dto.platform, lastSeen: new Date() });
  }

  await user.save();
  log.info({ userId }, 'Device registered');
}

export async function unregisterDevice(userId: string, fcmToken: string): Promise<void> {
  const result = await User.updateOne(
    { _id: new Types.ObjectId(userId), isDeleted: false },
    { $pull: { devices: { fcmToken } } }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError('User not found');
  }
  log.info({ userId }, 'Device unregistered');
}

export async function deleteAccount(userId: string): Promise<void> {
  const result = await User.updateOne(
    { _id: new Types.ObjectId(userId), isDeleted: false },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        email: `deleted_${userId}@removed`,
        name: 'Deleted User',
        devices: [],
        oauthProviders: [],
        avatarKey: undefined,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError('User not found');
  }

  eventBus.emit('user.deleted', { userId });
  log.info({ userId }, 'User account soft-deleted and PII anonymized');
}

export async function upsertOAuthUser(params: {
  provider: 'google' | 'apple';
  providerId: string;
  email: string;
  name: string;
  avatarKey?: string;
}): Promise<IUser> {
  const { provider, providerId, email, name, avatarKey } = params;

  const user = await User.findOneAndUpdate(
    { 'oauthProviders.provider': provider, 'oauthProviders.providerId': providerId },
    {
      $setOnInsert: {
        name,
        email,
        avatarKey,
        friendIds: [],
        devices: [],
      },
      $set: {
        'oauthProviders.$[elem].email': email,
      },
    },
    {
      upsert: true,
      new: true,
      arrayFilters: [{ 'elem.provider': provider, 'elem.providerId': providerId }],
    }
  ).lean();

  // If this was a new user (just inserted), add the oauthProvider entry
  if (user && user.oauthProviders.length === 0) {
    const freshUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { oauthProviders: { provider, providerId, email } } },
      { new: true }
    ).lean();
    return freshUser as IUser;
  }

  if (!user) {
    throw new ConflictError('Failed to upsert user');
  }

  return user as IUser;
}
