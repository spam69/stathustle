
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Identity as IdentityType, User as UserType, TeamMember as TeamMemberType, SocialLink } from '@/types';
import { IUserSchema } from './User.model'; // Import User document interface for owner reference

// Interface for Mongoose document
export interface IIdentitySchema extends Omit<IdentityType, 'id' | 'owner' | 'teamMembers' | 'socialLinks'>, Document {
  id: string; // Mongoose _id will be mapped to id
  owner: mongoose.Types.ObjectId | IUserSchema; // Can be ObjectId or populated User document
  teamMembers?: Array<{
    user: mongoose.Types.ObjectId | IUserSchema;
    permissions: string[];
    _id?: mongoose.Types.ObjectId;
  }>;
  socialLinks?: Array<{ platform: string; url: string; _id?: mongoose.Types.ObjectId }>;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<SocialLink>({
  platform: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const TeamMemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permissions: [{ type: String }],
}, { _id: false });

const IdentitySchema = new Schema<IIdentitySchema>({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  displayName: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true, sparse: true, index: true }, // Sparse for optional unique
  profilePictureUrl: { type: String },
  bannerImageUrl: { type: String },
  socialLinks: [SocialLinkSchema],
  bio: { type: String, maxlength: 500 }, // Increased bio length for identities
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [TeamMemberSchema],
  isIdentity: { type: Boolean, default: true, required: true },
  themePreference: { type: String, enum: ['light', 'dark', 'system', 'pink', 'blue'], default: 'system' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

IdentitySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const IdentityModel = (models.Identity as Model<IIdentitySchema, {}, {}, {}, IIdentitySchema>) || mongoose.model<IIdentitySchema>('Identity', IdentitySchema);

export default IdentityModel;
