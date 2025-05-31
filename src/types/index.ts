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
}

export interface Post {
  id: string;
  author: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'gif';
  teamSnapshot?: any; 
  tags?: string[]; 
  createdAt: string; 
  reactions: number;
  shares: number;
  repliesCount: number;
  // replies?: Reply[]; // For detailed view
}

export interface Reply {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface Blog {
  id:string;
  author: User; // Or Identity
  title: string;
  slug: string;
  content: string; 
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
  author: User;
  message: string;
  createdAt: string;
}

export interface Identity extends User {
  isIdentity: true;
  // teamMembers?: User[]; // Future
  // permissions?: any; // Future
}
