
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType, Identity as IdentityType } from '@/types';
import { IChatMessageSchema } from './ChatMessage.model'; // For lastMessage type

interface IParticipant {
  userRef: mongoose.Types.ObjectId;
  userModel: 'User' | 'Identity';
  _id?: mongoose.Types.ObjectId; // Mongoose adds this by default to subdocuments in arrays
}
// Interface for Mongoose document
export interface IChatConversationSchema extends Document {
  id: string;
  participants: IParticipant[];
  lastMessage?: mongoose.Types.ObjectId | IChatMessageSchema; // Optional reference to the last message
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  userRef: { type: Schema.Types.ObjectId, required: true, refPath: 'participants.userModel' },
  userModel: { type: String, required: true, enum: ['User', 'Identity'] },
}, { _id: false });


const ChatConversationSchema = new Schema<IChatConversationSchema>({
  participants: {
    type: [ParticipantSchema],
    required: true,
    validate: [
      (val: IParticipant[]) => val.length === 2, // Ensure exactly two participants for one-on-one chat
      'Conversations must have exactly two participants.'
    ]
  },
  lastMessage: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      // Transform participants for client if needed
      ret.participants = ret.participants.map((p: any) => ({
        userRef: p.userRef.toString(), // Or populate fully before sending
        userModel: p.userModel,
      }));
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      ret.participants = ret.participants.map((p: any) => ({
        userRef: p.userRef,
        userModel: p.userModel,
      }));
    }
  }
});

ChatConversationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Index on participants to quickly find conversations
// This is a compound index. Order matters for some queries.
ChatConversationSchema.index({ 'participants.userRef': 1 });


const ChatConversationModel = (models.ChatConversation as Model<IChatConversationSchema, {}, {}, {}, IChatConversationSchema>) || mongoose.model<IChatConversationSchema>('ChatConversation', ChatConversationSchema);

export default ChatConversationModel;
