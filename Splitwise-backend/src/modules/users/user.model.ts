import { model, Document, Types } from 'mongoose';
import { UserSchema } from './user.schema';
import { IUser } from './user.types';

export type UserDocument = Omit<IUser, '_id'> & Document & { _id: Types.ObjectId };

export const User = model<UserDocument>('User', UserSchema);
