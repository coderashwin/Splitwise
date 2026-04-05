import { model, Document, Types } from 'mongoose';
import { FriendshipSchema } from './friendship.schema';
import { IFriendship } from './friendship.types';

export type FriendshipDocument = Omit<IFriendship, '_id'> & Document & { _id: Types.ObjectId };

export const Friendship = model<FriendshipDocument>('Friendship', FriendshipSchema);
