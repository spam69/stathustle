import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { PlayerChatMessage as PlayerChatMessageType, User as UserType, Identity as IdentityType } from '@/types';

// Interface for Mongoose document
export interface IPlayerChatMessageSchema extends Omit<PlayerChatMessageType, 'id' | 'player' | 'author'>, Document {
  id: string;
  player: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorModel: 'User' | 'Identity';
  createdAt: Date;
  updatedAt: Date;
}

const PlayerChatMessageSchema = new Schema<IPlayerChatMessageSchema>({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  author: { type: Schema.Types.ObjectId, refPath: 'authorModel', required: true },
  authorModel: { type: String, enum: ['User', 'Identity'], required: true },
  message: { type: String, required: true },
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

PlayerChatMessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const PlayerChatMessageModel = (models.PlayerChatMessage as Model<IPlayerChatMessageSchema, {}, {}, {}, IPlayerChatMessageSchema>) || 
  mongoose.model<IPlayerChatMessageSchema>('PlayerChatMessage', PlayerChatMessageSchema);

export default PlayerChatMessageModel;
