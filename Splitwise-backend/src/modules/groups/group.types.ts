import { Types } from 'mongoose';

export interface IGroupMember {
  userId: Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface IGroup {
  _id: Types.ObjectId;
  name: string;
  type: 'trip' | 'home' | 'couple' | 'other';
  imageKey?: string;
  members: IGroupMember[];
  createdBy: Types.ObjectId;
  isActive: boolean;
  cacheVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroupDto {
  name: string;
  type?: 'trip' | 'home' | 'couple' | 'other';
  imageKey?: string;
  memberIds?: string[];
}

export interface UpdateGroupDto {
  name?: string;
  type?: 'trip' | 'home' | 'couple' | 'other';
  imageKey?: string;
}
