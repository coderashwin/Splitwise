import { Types } from 'mongoose';
import { mongoose } from '../../config/database';
import { Friendship } from './friendship.model';
import { User } from '../users/user.model';
import { IFriendship } from './friendship.types';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ConflictError } from '../../shared/errors/ConflictError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { eventBus } from '../../shared/events/event-bus';
import { buildCursorQuery, buildPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('friendship.service');

async function validateUsersExist(userIds: string[]): Promise<void> {
  for (const id of userIds) {
    const user = await User.findOne({ _id: new Types.ObjectId(id), isDeleted: false }).lean();
    if (!user) throw new NotFoundError(`User ${id} not found`);
  }
}

async function checkBlocked(userAId: string, userBId: string): Promise<void> {
  const blocked = await Friendship.findOne({
    $or: [
      { requester: new Types.ObjectId(userAId), recipient: new Types.ObjectId(userBId), status: 'blocked' },
      { requester: new Types.ObjectId(userBId), recipient: new Types.ObjectId(userAId), status: 'blocked' },
    ],
  }).lean();
  if (blocked) throw new ForbiddenError('Cannot interact with this user');
}

export async function sendFriendRequest(
  requesterId: string,
  recipientId: string
): Promise<IFriendship> {
  if (requesterId === recipientId) {
    throw new ValidationError('Cannot send friend request to yourself');
  }
  await validateUsersExist([requesterId, recipientId]);
  await checkBlocked(requesterId, recipientId);

  try {
    const friendship = await Friendship.create({
      requester: new Types.ObjectId(requesterId),
      recipient: new Types.ObjectId(recipientId),
      status: 'pending',
      initiator: new Types.ObjectId(requesterId),
    });

    eventBus.emit('friend.request.sent', { friendship: friendship.toObject(), actor: { userId: requesterId } });
    log.info({ requesterId, recipientId }, 'Friend request sent');
    return friendship.toObject() as IFriendship;
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      throw new ConflictError('Friend request already exists');
    }
    throw err;
  }
}

export async function acceptFriendRequest(
  friendshipId: string,
  userId: string
): Promise<IFriendship> {
  const friendship = await Friendship.findById(friendshipId).lean();
  if (!friendship) throw new NotFoundError('Friend request not found');
  if (String(friendship.recipient) !== userId) {
    throw new ForbiddenError('Only the recipient can accept this request');
  }
  if (friendship.status !== 'pending') {
    throw new ValidationError('Request is not in pending status');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updated = await Friendship.findOneAndUpdate(
      { _id: new Types.ObjectId(friendshipId), status: 'pending' },
      { $set: { status: 'accepted' } },
      { new: true, session }
    ).lean();

    if (!updated) throw new ValidationError('Unable to accept request');

    // Add each other to friendIds
    await User.updateOne(
      { _id: friendship.requester },
      { $addToSet: { friendIds: friendship.recipient } },
      { session }
    );
    await User.updateOne(
      { _id: friendship.recipient },
      { $addToSet: { friendIds: friendship.requester } },
      { session }
    );

    await session.commitTransaction();

    eventBus.emit('friend.accepted', { friendship: updated, actor: { userId } });
    log.info({ friendshipId, userId }, 'Friend request accepted');
    return updated as IFriendship;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function rejectFriendRequest(
  friendshipId: string,
  userId: string
): Promise<void> {
  const friendship = await Friendship.findById(friendshipId).lean();
  if (!friendship) throw new NotFoundError('Friend request not found');
  if (String(friendship.recipient) !== userId) {
    throw new ForbiddenError('Only the recipient can reject this request');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Friendship.findOneAndUpdate(
      { _id: new Types.ObjectId(friendshipId) },
      { $set: { status: 'rejected' } },
      { session }
    );

    // Remove from friendIds on both sides just in case
    await User.updateOne(
      { _id: friendship.requester },
      { $pull: { friendIds: friendship.recipient } },
      { session }
    );
    await User.updateOne(
      { _id: friendship.recipient },
      { $pull: { friendIds: friendship.requester } },
      { session }
    );

    await session.commitTransaction();
    log.info({ friendshipId }, 'Friend request rejected');
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function unfriend(userId: string, targetUserId: string): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Friendship.deleteOne({
      $or: [
        { requester: new Types.ObjectId(userId), recipient: new Types.ObjectId(targetUserId) },
        { requester: new Types.ObjectId(targetUserId), recipient: new Types.ObjectId(userId) },
      ],
    }, { session });

    await User.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { friendIds: new Types.ObjectId(targetUserId) } },
      { session }
    );
    await User.updateOne(
      { _id: new Types.ObjectId(targetUserId) },
      { $pull: { friendIds: new Types.ObjectId(userId) } },
      { session }
    );

    await session.commitTransaction();
    log.info({ userId, targetUserId }, 'Unfriended');
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listFriends(
  userId: string,
  limit: number,
  cursor?: string
): Promise<PaginatedResult<IFriendship>> {
  const cursorQuery = buildCursorQuery(cursor);
  const friendships = await Friendship.find({
    $or: [
      { requester: new Types.ObjectId(userId) },
      { recipient: new Types.ObjectId(userId) },
    ],
    status: 'accepted',
    ...cursorQuery,
  })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildPaginatedResult(
    friendships.map((f) => ({ ...f, date: f.updatedAt })) as Array<IFriendship & { date: Date }>,
    limit
  ) as PaginatedResult<IFriendship>;
}

export async function listPendingRequests(userId: string): Promise<IFriendship[]> {
  return Friendship.find({
    recipient: new Types.ObjectId(userId),
    status: 'pending',
  })
    .sort({ createdAt: -1 })
    .lean() as Promise<IFriendship[]>;
}

export async function blockUser(userId: string, targetUserId: string): Promise<void> {
  if (userId === targetUserId) throw new ValidationError('Cannot block yourself');
  await validateUsersExist([targetUserId]);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Update or create blocked friendship
    await Friendship.findOneAndUpdate(
      {
        $or: [
          { requester: new Types.ObjectId(userId), recipient: new Types.ObjectId(targetUserId) },
          { requester: new Types.ObjectId(targetUserId), recipient: new Types.ObjectId(userId) },
        ],
      },
      {
        $set: {
          requester: new Types.ObjectId(userId),
          recipient: new Types.ObjectId(targetUserId),
          status: 'blocked',
          initiator: new Types.ObjectId(userId),
        },
      },
      { upsert: true, session }
    );

    // Remove from friendIds on both sides
    await User.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { friendIds: new Types.ObjectId(targetUserId) } },
      { session }
    );
    await User.updateOne(
      { _id: new Types.ObjectId(targetUserId) },
      { $pull: { friendIds: new Types.ObjectId(userId) } },
      { session }
    );

    await session.commitTransaction();
    log.info({ userId, targetUserId }, 'User blocked');
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
