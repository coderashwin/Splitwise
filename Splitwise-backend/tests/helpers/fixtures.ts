import { Types } from 'mongoose';
import { User } from '../../src/modules/users/user.model';
import { Group } from '../../src/modules/groups/group.model';

export async function createTestUser(overrides: Partial<{
  name: string;
  email: string;
  isDeleted: boolean;
}> = {}): Promise<{ _id: Types.ObjectId; name: string; email: string }> {
  const unique = new Types.ObjectId().toString();
  const user = await User.create({
    name: overrides.name ?? `Test User ${unique}`,
    email: overrides.email ?? `user-${unique}@test.com`,
    oauthProviders: [{
      provider: 'google',
      providerId: unique,
      email: overrides.email ?? `user-${unique}@test.com`,
    }],
    devices: [],
    friendIds: [],
    isDeleted: overrides.isDeleted ?? false,
  });
  return { _id: user._id, name: user.name, email: user.email };
}

export async function createTestGroup(
  creatorId: string,
  memberIds: string[] = []
): Promise<{ _id: Types.ObjectId; name: string }> {
  const group = await Group.create({
    name: `Test Group ${new Types.ObjectId().toString()}`,
    type: 'other',
    members: [
      { userId: new Types.ObjectId(creatorId), role: 'admin', joinedAt: new Date() },
      ...memberIds.map((id) => ({
        userId: new Types.ObjectId(id),
        role: 'member',
        joinedAt: new Date(),
      })),
    ],
    createdBy: new Types.ObjectId(creatorId),
    isActive: true,
    cacheVersion: 0,
  });
  return { _id: group._id, name: group.name };
}
