import type { User, Identity } from '@/types';
import { Types } from 'mongoose';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

export const getAuthorDisplayInfo = (author: User | Identity) => {
  if (!author || typeof author !== 'object') {
    return { username: '', displayName: '', profilePictureUrl: '', isIdentity: false };
  }
  const username = author.username;
  const displayName = typeof author === 'object' && 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const profilePictureUrl = author.profilePictureUrl;
  const isIdentity = typeof author === 'object' && 'isIdentity' in author && (author as Identity).isIdentity;
  return { username, displayName, profilePictureUrl, isIdentity };
};

export const getInitials = (name: string = "") => {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
};

export const getParticipantInfo = async (participantId: string) => {
    // Try finding a user first
    let participant = await UserModel.findById(participantId).lean();
    if (participant) {
        return {
            id: participant._id.toString(),
            username: participant.username,
            displayName: participant.username,
            avatar: participant.profilePictureUrl,
            isIdentity: false
        };
    }
    // If not a user, try finding an identity
    participant = await IdentityModel.findById(participantId).lean();
    if (participant) {
        return {
            id: participant._id.toString(),
            username: participant.username,
            displayName: participant.displayName || participant.username,
            avatar: participant.profilePictureUrl,
            isIdentity: true
        };
    }
    return null;
}; 