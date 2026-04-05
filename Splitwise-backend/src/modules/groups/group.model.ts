import { model, Document, Types } from 'mongoose';
import { GroupSchema } from './group.schema';
import { IGroup } from './group.types';

export type GroupDocument = Omit<IGroup, '_id'> & Document & { _id: Types.ObjectId };

export const Group = model<GroupDocument>('Group', GroupSchema);
