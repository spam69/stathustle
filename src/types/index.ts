

export type SportInterestLevel = 'very interested' | 'somewhat interested' | 'no interest';

export interface SportInterest {
  sport: string;
  level: SportInterestLevel;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  sportInterests?: SportInterest[];
  themePreference?: 'light' | 'dark' | 'pink' | 'blue'; // Pink and blue are future
  bio?: string;
  isIdentity?: false; // Explicitly mark as not an identity
}

export interface TeamMember {
  user: User;
  permissions: string[]; // e.g., ['can_post', 'can_edit_blogs']
}

export interface Identity {
  id: string;
  username: string; // The @username for the Identity itself
  displayName?: string; // Optional display name for the Identity
  email?: string; // Contact email for the Identity
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  bio?: string;
  owner: User; // The User who owns/manages this Identity
  teamMembers?: TeamMember[];
  isIdentity: true; // Discriminator property
  themePreference?: 'light' | 'dark' | 'pink' | 'blue'; // Identities can also have theme preferences
}


export interface Comment {
  id: string;
  author: User | Identity;
  content: string;
  createdAt: string;
  parentId?: string; // ID of the comment this is a reply to
  likes?: number;
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
  reactions: number; // Reactions on the post itself
  shares: number;
  repliesCount: number; // Total number of comments and replies on the post
  comments?: Comment[]; // Flat list of all comments and replies for this post
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
  team?: string; // e.g., "Los Angeles Lakers"
  position?: string; // e.g., "Guard"
}

export interface PlayerChatMessage {
  id: string;
  player: Player;
  author: User | Identity;
  message: string;
  createdAt: string;
}

// This was previously defined as an extension of User, but now it's a distinct type.
// export interface Identity extends User {
//   isIdentity: true;
//   // teamMembers?: User[]; // Future
//   // permissions?: any; // Future
// }

