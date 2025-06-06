
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Comment as CommentType, User as UserType, Identity as IdentityType, ReactionEntry } from '@/types';
import ReactionEntrySchema, { IReactionEntrySchema } from './common/Reaction.schema';

// Interface for Mongoose document
export interface ICommentSchema extends Omit<CommentType, 'id' | 'author' | 'detailedReactions' | 'createdAt'>, Document {
  id: string;
  author: mongoose.Types.ObjectId | UserType | IdentityType;
  authorModel: 'User' | 'Identity';
  detailedReactions?: IReactionEntrySchema[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentSchema>({
  author: { type: Schema.Types.ObjectId, required: true, refPath: 'authorModel' },
  authorModel: { type: String, required: true, enum: ['User', 'Identity'] },
  content: { type: String, required: true, maxlength: 1000 },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', sparse: true },
  detailedReactions: [ReactionEntrySchema],
  // postId is implicitly managed by embedding/referencing within Post model or specific queries
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

CommentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const CommentModel = (models.Comment as Model<ICommentSchema, {}, {}, {}, ICommentSchema>) || mongoose.model<ICommentSchema>('Comment', CommentSchema);

export default CommentModel;
