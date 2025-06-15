import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Notification as NotificationType, User as UserType, Identity as IdentityType, Post as PostType, Comment as CommentType, NotificationType as NotificationEnumType } from '@/types';

const notificationTypeEnumValues: NotificationEnumType[] = [
  'new_reaction_post', 
  'new_comment', 
  'new_reply', 
  'new_reaction_comment',
  'new_follower'
];

// Interface for Mongoose document
export interface INotificationSchema extends Omit<NotificationType, 'id' | 'actor' | 'recipientId' | 'recipientModel' | 'postId' | 'commentId' | 'originalCommentId' | 'createdAt'>, Document {
  id: string;
  actor: mongoose.Types.ObjectId | UserType | IdentityType;
  actorModel: 'User' | 'Identity';
  recipientId: mongoose.Types.ObjectId | UserType | IdentityType;
  recipientModel: 'User' | 'Identity';
  postId?: mongoose.Types.ObjectId | PostType;
  commentId?: mongoose.Types.ObjectId | CommentType;
  originalCommentId?: mongoose.Types.ObjectId | CommentType;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationSchema>({
  type: { type: String, enum: notificationTypeEnumValues, required: true },
  actor: { type: Schema.Types.ObjectId, required: true, refPath: 'actorModel' },
  actorModel: { type: String, required: true, enum: ['User', 'Identity'] },
  recipientId: { type: Schema.Types.ObjectId, required: true, refPath: 'recipientModel', index: true },
  recipientModel: { type: String, required: true, enum: ['User', 'Identity'] },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', sparse: true },
  commentId: { type: Schema.Types.ObjectId, ref: 'Comment', sparse: true },
  originalCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', sparse: true },
  message: { type: String, required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
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

NotificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const NotificationModel = (models.Notification as Model<INotificationSchema, {}, {}, {}, INotificationSchema>) || mongoose.model<INotificationSchema>('Notification', NotificationSchema);

export default NotificationModel;
