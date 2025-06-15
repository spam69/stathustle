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
  displayName?: string; // Added optional displayName
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  sportInterests?: SportInterest[];
  themePreference?: 'light' | 'dark' | 'pink' | 'blue';
  bio?: string;
  isIdentity?: false;
  followers?: string[]; // Array of user/identity IDs that follow this user
  following?: string[]; // Array of user/identity IDs that this user follows
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
  followers?: string[]; // Array of user/identity IDs that follow this identity
  following?: string[]; // Array of user/identity IDs that this identity follows
}

export interface ReactionEntry {
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: User | Identity;
  content: string;
  createdAt: string;
  parentId?: string;
  detailedReactions?: ReactionEntry[];
  mediaUrl?: string;
  mediaType?: 'image' | 'gif';
}

export interface BlogShareDetails {
  title: string;
  url: string; 
  authorDisplayName: string;
  authorUsername: string;
  excerpt?: string;
  coverImageUrl?: string;
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
  detailedReactions?: ReactionEntry[];
  shares: number;
  repliesCount: number;
  comments?: Comment[];
  sharedOriginalPostId?: string;
  sharedOriginalPost?: Post;
  blogShareDetails?: BlogShareDetails; // Added for sharing blogs
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

export type NotificationType = 
  | 'new_reaction_post' 
  | 'new_comment' 
  | 'new_reply' 
  | 'new_reaction_comment'
  | 'new_follower';

export interface Notification {
  id: string;
  type: NotificationType;
  actor: User | Identity;
  recipientId: string;
  recipientModel: 'User' | 'Identity';
  postId?: string;
  commentId?: string;
  originalCommentId?: string;
  message: string;
  link: string;
  createdAt: string;
  isRead: boolean;
}
