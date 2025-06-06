
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Blog as BlogType, User as UserType, Identity as IdentityType } from '@/types';

// Interface for Mongoose document
export interface IBlogSchema extends Omit<BlogType, 'id' | 'author' | 'createdAt'>, Document {
  id: string;
  author: mongoose.Types.ObjectId | UserType | IdentityType;
  authorModel: 'User' | 'Identity';
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlogSchema>({
  author: { type: Schema.Types.ObjectId, required: true, refPath: 'authorModel' },
  authorModel: { type: String, required: true, enum: ['User', 'Identity'] },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  slug: { type: String, required: true, unique: false, trim: true, index: true }, // Slug might not be globally unique, but unique per author
  content: { type: String, required: true },
  excerpt: { type: String, maxlength: 500 },
  coverImageUrl: { type: String },
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

BlogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// To ensure slug is unique per author (if required, otherwise remove or adjust)
// BlogSchema.index({ author: 1, slug: 1 }, { unique: true });
// For UUID slugs, simple index on slug is fine. If slug can be human-readable, then per author might be good.
// Since we moved to UUID for slugs, a simple index on slug should be okay.

const BlogModel = (models.Blog as Model<IBlogSchema, {}, {}, {}, IBlogSchema>) || mongoose.model<IBlogSchema>('Blog', BlogSchema);

export default BlogModel;
