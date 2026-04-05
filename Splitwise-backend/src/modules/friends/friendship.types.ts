import { Types } from 'mongoose';

export interface IFriendship {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  initiator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
