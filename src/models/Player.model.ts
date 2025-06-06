
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Player as PlayerType } from '@/types';

// Interface for Mongoose document
export interface IPlayerSchema extends Omit<PlayerType, 'id'>, Document {
  id: string;
  // Mongoose adds createdAt and updatedAt automatically with timestamps: true
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayerSchema>({
  name: { type: String, required: true, trim: true, index: true },
  sport: { type: String, required: true, trim: true, index: true },
  profilePictureUrl: { type: String },
  team: { type: String, trim: true },
  position: { type: String, trim: true },
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

PlayerSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const PlayerModel = (models.Player as Model<IPlayerSchema, {}, {}, {}, IPlayerSchema>) || mongoose.model<IPlayerSchema>('Player', PlayerSchema);

export default PlayerModel;
