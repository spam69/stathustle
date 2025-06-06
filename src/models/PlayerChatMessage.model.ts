
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { PlayerChatMessage as PlayerChatMessageOriginType, Player as PlayerType, User as UserType, Identity as IdentityType } from '@/types';

// Interface for Mongoose document
export interface IPlayerChatMessageSchema extends Omit<PlayerChatMessageOriginType, 'id' | 'player' | 'author' | 'createdAt'>, Document {
  id: string;
  player: mongoose.Types.ObjectId | PlayerType;
  author: mongoose.Types.ObjectId | UserType | IdentityType;
  authorModel: 'User' | 'Identity';
  createdAt: Date;
  updatedAt: Date;
}

const PlayerChatMessageSchema = new Schema<IPlayerChatMessageSchema>({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
  author: { type: Schema.Types.ObjectId, required: true, refPath: 'authorModel' },
  authorModel: { type: String, required: true, enum: ['User', 'Identity'] },
  message: { type: String, required: true, maxlength: 500 },
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

const PlayerChatMessageModel = (models.PlayerChatMessage as Model<IPlayerChatMessageSchema, {}, {}, {}, IPlayerChatMessageSchema>) || mongoose.model<IPlayerChatMessageSchema>('PlayerChatMessage', PlayerChatMessageSchema);

export default PlayerChatMessageModel;
