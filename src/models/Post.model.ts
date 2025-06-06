
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentType, ReactionEntry, BlogShareDetails } from '@/types';
import ReactionEntrySchema, { IReactionEntrySchema } from './common/Reaction.schema';
import BlogShareDetailsSchema from './common/BlogShareDetails.schema';

// Interface for Mongoose document
export interface IPostSchema extends Omit<PostType, 'id' | 'author' | 'comments' | 'detailedReactions' | 'sharedOriginalPost' | 'blogShareDetails' | 'createdAt'>, Document {
  id: string;
  author: mongoose.Types.ObjectId | UserType | IdentityType;
  authorModel: 'User' | 'Identity';
  comments?: (mongoose.Types.ObjectId | CommentType)[]; // Array of Comment IDs
  detailedReactions?: IReactionEntrySchema[];
  sharedOriginalPostId?: mongoose.Types.ObjectId | PostType;
  blogShareDetails?: BlogShareDetails; // Embedded directly
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPostSchema>({
  author: { type: Schema.Types.ObjectId, required: true, refPath: 'authorModel' },
  authorModel: { type: String, required: true, enum: ['User', 'Identity'] },
  content: { type: String, required: function(this: IPostSchema) {
    // Content is not required if sharing a post or a blog
    return !this.sharedOriginalPostId && !this.blogShareDetails;
  }, maxlength: 2000 },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'gif'] },
  teamSnapshot: { type: Schema.Types.Mixed },
  tags: [{ type: String, trim: true }],
  detailedReactions: [ReactionEntrySchema],
  shares: { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  sharedOriginalPostId: { type: Schema.Types.ObjectId, ref: 'Post', sparse: true },
  blogShareDetails: { type: BlogShareDetailsSchema, default: undefined },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true, // Needed for virtuals like sharedOriginalPost if defined
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    getters: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

PostSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for sharedOriginalPost (if you want to populate it)
// Note: Populating virtuals requires specific query handling.
// For simplicity, the API might handle fetching the original post separately if needed.
// PostSchema.virtual('sharedOriginalPost', {
//   ref: 'Post',
//   localField: 'sharedOriginalPostId',
//   foreignField: '_id',
//   justOne: true
// });


const PostModel = (models.Post as Model<IPostSchema, {}, {}, {}, IPostSchema>) || mongoose.model<IPostSchema>('Post', PostSchema);

export default PostModel;
