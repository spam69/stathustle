
import mongoose, { Schema } from 'mongoose';
import type { ReactionEntry as ReactionEntryType, User as UserType } from '@/types'; // Assuming reactions are by Users for now
import { reactionTypesArray } from '@/lib/reactions'; // Helper to get reaction types

// Interface for Mongoose sub-document
export interface IReactionEntrySchema extends Omit<ReactionEntryType, 'userId' | 'createdAt'> {
  userId: mongoose.Types.ObjectId | UserType; // Assuming reactions are by Users
  createdAt: Date;
}

const ReactionEntrySchema = new Schema<IReactionEntrySchema>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Assuming only Users can react for now
  reactionType: { type: String, enum: reactionTypesArray, required: true },
}, {
  _id: false, // No separate _id for subdocuments unless explicitly needed
  timestamps: { createdAt: true, updatedAt: false }, // Only createdAt for reactions
});

export default ReactionEntrySchema;
