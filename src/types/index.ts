
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
  | 'new_follower'; // Added new_follower

export interface Notification {
  id: string;
  type: NotificationType;
  actor: User | Identity; // The user who performed the action
  recipientUserId: string; // The ID of the user who should receive the notification
  postId?: string; // ID of the post related to the notification
  commentId?: string; // ID of the comment related to the notification (if it's a reply or comment reaction)
  originalCommentId?: string; // If type is 'new_reply', this is the ID of the comment being replied to
  message: string; // Generated message for the notification
  link: string; // URL to navigate to when the notification is clicked
  createdAt: string;
  isRead: boolean;
}

