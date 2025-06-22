import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IConversationSchema extends Document {
  participants: mongoose.Types.ObjectId[]; // User or Identity IDs
  lastMessage?: mongoose.Types.ObjectId; // Message ID
  unreadCounts: Record<string, number>; // { userId: number }
  updatedAt: Date;
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversationSchema>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  unreadCounts: { type: Schema.Types.Mixed, default: {} },
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

ConversationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const ConversationModel = (models.Conversation as Model<IConversationSchema>) || mongoose.model<IConversationSchema>('Conversation', ConversationSchema);

export default ConversationModel; 