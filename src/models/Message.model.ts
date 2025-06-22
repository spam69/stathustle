import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IMessageSchema extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content?: string;
  type: 'text' | 'file' | 'gif';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageSchema>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: false },
  type: { type: String, enum: ['text', 'file', 'gif'], required: true },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  read: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      ret.senderId = ret.sender.toString();
      ret.receiverId = ret.receiver.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.sender;
      delete ret.receiver;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      ret.senderId = ret.sender.toString();
      ret.receiverId = ret.receiver.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.sender;
      delete ret.receiver;
    }
  }
});

MessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const MessageModel = (models.Message as Model<IMessageSchema>) || mongoose.model<IMessageSchema>('Message', MessageSchema);

export default MessageModel; 