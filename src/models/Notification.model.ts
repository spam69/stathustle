
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
export interface INotificationSchema extends Omit<NotificationType, 'id' | 'actor' | 'recipientUserId' | 'postId' | 'commentId' | 'originalCommentId' | 'createdAt'>, Document {
  id: string;
  actor: mongoose.Types.ObjectId | UserType | IdentityType;
  actorModel: 'User' | 'Identity';
  recipientUserId: mongoose.Types.ObjectId | UserType; // Notifications are for Users
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
  recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', sparse: true },
  commentId: { type: Schema.Types.ObjectId, ref: 'Comment', sparse: true }, // Assuming direct ref, no postId needed if commentId is globally unique
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
