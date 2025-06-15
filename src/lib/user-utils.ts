import type { User, Identity } from '@/types';

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