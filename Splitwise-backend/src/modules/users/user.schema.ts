import { Schema } from 'mongoose';

export const DeviceSubSchema = new Schema(
  {
    fcmToken: { type: String, required: true },
    platform: { type: String, enum: ['android', 'ios'], required: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const OAuthProviderSubSchema = new Schema(
  {
    provider: { type: String, enum: ['google', 'apple'], required: true },
    providerId: { type: String, required: true },
    email: { type: String },
  },
  { _id: false }
);

export const UserSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    avatarKey: { type: String },
    oauthProviders: { type: [OAuthProviderSubSchema], default: [] },
    devices: { type: [DeviceSubSchema], default: [] },
    friendIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index(
  { 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 },
  { unique: true, sparse: true }
);
UserSchema.index({ name: 'text' });
UserSchema.index({ friendIds: 1 });
UserSchema.index(
  { isDeleted: 1 },
  { partialFilterExpression: { isDeleted: false } }
);
