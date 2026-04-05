import { Schema } from 'mongoose';

const GroupMemberSubSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const GroupSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    type: {
      type: String,
      enum: ['trip', 'home', 'couple', 'other'],
      default: 'other',
    },
    imageKey: { type: String },
    members: { type: [GroupMemberSubSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    cacheVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'groups',
  }
);

GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ isActive: 1 });
