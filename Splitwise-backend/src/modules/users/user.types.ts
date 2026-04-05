import { Types } from 'mongoose';

export interface IDevice {
  fcmToken: string;
  platform: 'android' | 'ios';
  lastSeen: Date;
}

export interface IOAuthProvider {
  provider: 'google' | 'apple';
  providerId: string;
  email?: string;
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  avatarKey?: string;
  oauthProviders: IOAuthProvider[];
  devices: IDevice[];
  friendIds: Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  name: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatarKey?: string;
}

export interface RegisterDeviceDto {
  fcmToken: string;
  platform: 'android' | 'ios';
}
