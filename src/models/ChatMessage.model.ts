
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType, Identity as IdentityType } from '@/types';

// Interface for Mongoose document
export interface IChatMessageSchema extends Document {
  id: string;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId | UserType | IdentityType;
  senderModel: 'User' | 'Identity';
  // receiver: mongoose.Types.ObjectId | UserType | IdentityType; // Not needed if using conversationId
  // receiverModel: 'User' | 'Identity'; // Not needed if using conversationId
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessageSchema>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'ChatConversation', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
  senderModel: { type: String, required: true, enum: ['User', 'Identity'] },
  // receiver: { type: Schema.Types.ObjectId, required: true, refPath: 'receiverModel' }, // Removed, part of conversation
  // receiverModel: { type: String, required: true, enum: ['User', 'Identity'] }, // Removed
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false },
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

ChatMessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const ChatMessageModel = (models.ChatMessage as Model<IChatMessageSchema, {}, {}, {}, IChatMessageSchema>) || mongoose.model<IChatMessageSchema>('ChatMessage', ChatMessageSchema);

export default ChatMessageModel;
