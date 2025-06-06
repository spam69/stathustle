
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType, SportInterest, SocialLink } from '@/types'; // Using UserType to avoid naming conflict

// We need to define interfaces for Mongoose documents that extend our types and Mongoose's Document
export interface IUserSchema extends Omit<UserType, 'id' | 'sportInterests' | 'socialLinks'>, Document {
  id: string; // Mongoose _id will be mapped to id
  sportInterests?: Array<{ sport: string; level: string; _id?: mongoose.Types.ObjectId }>;
  socialLinks?: Array<{ platform: string; url: string; _id?: mongoose.Types.ObjectId }>;
  // Mongoose adds createdAt and updatedAt automatically with timestamps: true
  createdAt: Date;
  updatedAt: Date;
}

const SportInterestSchema = new Schema<SportInterest>({
  sport: { type: String, required: true },
  level: { type: String, enum: ['very interested', 'somewhat interested', 'no interest'], required: true },
}, { _id: false });

const SocialLinkSchema = new Schema<SocialLink>({
  platform: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const UserSchema = new Schema<IUserSchema>({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  password: { type: String, required: true }, // Password hashing should be handled via middleware
  profilePictureUrl: { type: String },
  bannerImageUrl: { type: String },
  socialLinks: [SocialLinkSchema],
  sportInterests: [SportInterestSchema],
  themePreference: { type: String, enum: ['light', 'dark', 'system', 'pink', 'blue'], default: 'system' },
  bio: { type: String, maxlength: 300 },
  isIdentity: { type: Boolean, default: false, required: true },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Ensure password is not sent back
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
    }
  }
});

// TODO: Add pre-save middleware for password hashing
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password') || !this.password) {
//     return next();
//   }
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     return next();
//   } catch (err) {
//     return next(err as Error);
//   }
// });

// Ensure virtual 'id' is included
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


const UserModel = (models.User as Model<IUserSchema, {}, {}, {}, IUserSchema>) || mongoose.model<IUserSchema>('User', UserSchema);

export default UserModel;
