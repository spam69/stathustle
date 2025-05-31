
import type { ReactionType } from '@/lib/reactions';

export type SportInterestLevel = 'very interested' | 'somewhat interested' | 'no interest';

export interface SportInterest {
  sport: string;
  level: SportInterestLevel;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; 
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  sportInterests?: SportInterest[];
  themePreference?: 'light' | 'dark' | 'pink' | 'blue'; 
  bio?: string;
  isIdentity?: false; 
}

export interface TeamMember {
  user: User;
  permissions: string[]; 
}

export interface Identity {
  id: string;
  username: string; 
  displayName?: string; 
  email?: string; 
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  bio?: string;
  owner: User; 
  teamMembers?: TeamMember[];
  isIdentity: true; 
  themePreference?: 'light' | 'dark' | 'pink' | 'blue'; 
}

export interface ReactionEntry {
  userId: string; // ID of the User or Identity owner who reacted
  // In a more complex system, you might distinguish if an Identity itself reacted
  // For now, we assume the owner of an Identity reacts as the Identity if currentUser is an Identity.
  // Or, simply always use the User's ID from the session. Let's stick to User's ID from session.
  reactionType: ReactionType;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: User | Identity;
  content: string;
  createdAt: string;
  parentId?: string; 
  detailedReactions?: ReactionEntry[]; // Replaces likes
}

export interface Post {
  id: string;
  author: User | Identity;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'gif';
  teamSnapshot?: any;
  tags?: string[];
  createdAt: string;
  detailedReactions?: ReactionEntry[]; // Replaces reactions (number)
  shares: number;
  repliesCount: number; 
  comments?: Comment[]; 
}

export interface Blog {
  id:string;
  author: User | Identity; 
  title: string;
  slug: string;
  content:string;
  excerpt?: string;
  coverImageUrl?: string;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  sport: string;
  profilePictureUrl?: string;
  team?: string; 
  position?: string; 
}

export interface PlayerChatMessage {
  id: string;
  player: Player;
  author: User | Identity;
  message: string;
  createdAt: string;
}
