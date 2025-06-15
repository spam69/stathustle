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
  followers: Array<mongoose.Types.ObjectId>;
  followerModel: string;
  following: Array<mongoose.Types.ObjectId>;
  followingModel: string;
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
  username: { type: String, required: true, unique: true, trim: true, index: true, minlength: 3, maxlength: 30 },
  displayName: { type: String, trim: true, maxlength: 50 },
  email: { type: String, trim: true, lowercase: true, sparse: true, index: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] },
  profilePictureUrl: { type: String, default: '' },
  bannerImageUrl: { type: String, default: '' },
  socialLinks: [SocialLinkSchema],
  bio: { type: String, maxlength: 500 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [TeamMemberSchema],
  isIdentity: { type: Boolean, default: true, required: true },
  themePreference: { type: String, enum: ['light', 'dark', 'system', 'pink', 'blue'], default: 'system' },
  followers: [{ type: Schema.Types.ObjectId, refPath: 'followerModel' }],
  followerModel: { type: String, enum: ['User', 'Identity'] },
  following: [{ type: Schema.Types.ObjectId, refPath: 'followingModel' }],
  followingModel: { type: String, enum: ['User', 'Identity'] },
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

// Set default profile picture and banner image based on username/displayName if not provided
IdentitySchema.pre<IIdentitySchema>('save', function(next) {
  if (!this.profilePictureUrl) {
    const nameForPlaceholder = this.displayName || this.username;
    this.profilePictureUrl = `https://placehold.co/200x200.png?text=${nameForPlaceholder[0]?.toUpperCase() || 'I'}`;
  }
  if (!this.bannerImageUrl) {
    this.bannerImageUrl = `https://placehold.co/1200x300.png?text=Identity`;
  }
  if (!this.displayName) {
    this.displayName = this.username;
  }
  next();
});

const IdentityModel = (models.Identity as Model<IIdentitySchema, {}, {}, {}, IIdentitySchema>) || mongoose.model<IIdentitySchema>('Identity', IdentitySchema);

export default IdentityModel;
