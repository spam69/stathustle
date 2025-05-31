
import type { User, Post, Blog, Player, PlayerChatMessage, SportInterest, Comment, Identity } from '@/types';

// Make mock data mutable for API route simulation
let mockUser1Data: User = {
  id: 'user1',
  username: 'FantasyFanatic',
  email: 'fanatic@stathustle.com',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  bannerImageUrl: 'https://placehold.co/1200x300.png',
  socialLinks: [
    { platform: 'Twitter', url: 'https://twitter.com/fantasyfanatic' },
    { platform: 'Instagram', url: 'https://instagram.com/fantasyfanatic' },
  ],
  sportInterests: [
    { sport: 'Basketball', level: 'very interested' },
    { sport: 'Football', level: 'somewhat interested' },
  ],
  themePreference: 'light',
  bio: 'Dedicated fantasy sports player. Always looking for the next big stat!',
  isIdentity: false,
};

let mockUser2Data: User = {
  id: 'user2',
  username: 'AnalystProUser',
  email: 'pro@stathustle.com',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  bannerImageUrl: 'https://placehold.co/1200x300.png',
  sportInterests: [
    { sport: 'Baseball', level: 'very interested' },
    { sport: 'Hockey', level: 'very interested' },
  ],
  themePreference: 'dark',
  bio: 'Professional sports analyst providing top-tier insights. This is my user account.',
  isIdentity: false,
};

export let mockUsers: User[] = [mockUser1Data, mockUser2Data];

export let mockIdentityAnalystProData: Identity = {
  id: 'identity1',
  username: 'AnalystPro',
  displayName: 'Pro Analysis Hub',
  email: 'contact@proanalysis.com',
  profilePictureUrl: 'https://placehold.co/200x200.png?text=ProIdentity',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=ProBanner',
  socialLinks: [{ platform: 'Website', url: 'https://proanalysis.com'}],
  bio: 'The official hub for AnalystPro\'s insights and articles. Follow for top-tier fantasy advice.',
  owner: mockUser2Data,
  teamMembers: [
    { user: mockUser1Data, permissions: ['can_post_blogs'] }
  ],
  isIdentity: true,
  themePreference: 'dark',
};

export let mockIdentityFanaticBrandData: Identity = {
  id: 'identity2',
  username: 'FanaticInsights',
  displayName: 'FantasyFanatic Insights',
  profilePictureUrl: 'https://placehold.co/200x200.png?text=FFI',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=FFIBanner',
  bio: 'Deep dives and hot takes from FantasyFanatic.',
  owner: mockUser1Data,
  isIdentity: true,
  themePreference: 'light',
};

export let mockIdentities: Identity[] = [mockIdentityAnalystProData, mockIdentityFanaticBrandData];


const mockComment1_post1: Comment = {
  id: 'comment1-post1',
  author: mockUser2Data,
  content: 'Great point about sleeper picks! I am keeping an eye on Player Z.',
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  likes: 5,
};

const mockReply1_to_comment1_post1: Comment = {
  id: 'reply1-to-comment1-post1',
  author: mockUser1Data,
  content: 'Thanks! Player Z is a good call, solid potential.',
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  parentId: 'comment1-post1',
  likes: 2,
};

const mockReply2_to_comment1_post1: Comment = {
  id: 'reply2-to-comment1-post1',
  author: mockUser2Data,
  content: 'Definitely! Watched some film on him, looks promising.',
  createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  parentId: 'comment1-post1',
  likes: 1,
};

const mockComment2_post1: Comment = {
  id: 'comment2-post1',
  author: mockUser1Data,
  content: 'Any thoughts on Player X? Seems a bit overrated to me this year.',
  createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  likes: 3,
};

const mockComment1_post3: Comment = {
  id: 'comment1-post3',
  author: mockUser2Data,
  content: 'That game was epic! Still buzzing from it.',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
  likes: 10,
};

export let mockPosts: Post[] = [
  {
    id: 'post1',
    author: mockUser1Data,
    content: 'Just drafted my fantasy basketball team! Feeling good about this season. 🏀 Who do you think is a sleeper pick this year? #FantasyBasketball #NBA',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reactions: 15,
    shares: 3,
    repliesCount: 4,
    comments: [mockComment1_post1, mockReply1_to_comment1_post1, mockReply2_to_comment1_post1, mockComment2_post1],
    mediaUrl: 'https://placehold.co/600x400.png',
    mediaType: 'image',
    tags: ['@FantasyPlayerX', '#FantasyBasketball']
  },
  {
    id: 'post2',
    author: mockIdentityAnalystProData,
    content: "<b>Deep Dive Analysis (posted as @AnalystPro)</b>: Top 5 NFL quarterbacks to watch for MVP contention. My projections are looking interesting! 🏈 <i>Full blog post coming soon!</i>",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    reactions: 42,
    shares: 10,
    repliesCount: 0,
    comments: [],
    teamSnapshot: { teamName: 'GridironGurus', players: ['QB1', 'RB1', 'WR1'] },
    tags: ['#NFLAnalysis', '#FantasyFootball']
  },
  {
    id: 'post3',
    author: mockUser1Data,
    content: "Anyone else catch that amazing hockey game last night? The overtime goal was insane! 🏒🥅 #NHL #HockeyHighlights",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    reactions: 22,
    shares: 1,
    repliesCount: 1,
    comments: [mockComment1_post3],
    mediaUrl: 'https://placehold.co/400x225.png',
    mediaType: 'gif',
    tags: ['#Hockey']
  },
];

export let mockBlogs: Blog[] = [
  {
    id: 'blog1',
    author: mockIdentityAnalystProData,
    title: 'The Undervalued Stars of MLB: A Statistical Breakdown (by @AnalystPro)',
    slug: 'undervalued-mlb-stars',
    excerpt: 'Discover which MLB players are outperforming their fantasy value based on advanced metrics. My analysis points to some key pickups...',
    content: '<p>Full blog content here... discussing advanced stats like wOBA, FIP, and xBA for several players. Includes charts and tables.</p><img src="https://placehold.co/800x400.png" alt="MLB Stats Chart" data-ai-hint="baseball statistics" /> <p>More analysis follows...</p>',
    coverImageUrl: 'https://placehold.co/800x450.png',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'blog2',
    author: mockUser1Data,
    title: 'My Top 10 Fantasy Basketball Draft Picks for 2024',
    slug: 'top-10-fantasy-basketball-2024',
    excerpt: 'Get ready for your fantasy basketball draft! Here are my top 10 must-have players for the upcoming season, complete with rationale...',
    content: '<p>Detailed analysis of 10 basketball players, their strengths, weaknesses, and fantasy outlook. </p> <p>Inline images can be added here for each player.</p>',
    coverImageUrl: 'https://placehold.co/800x450.png',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export const mockPlayerLukaData: Player = {
  id: 'player1',
  name: 'Luka Doncic',
  sport: 'Basketball',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  team: 'Dallas Mavericks',
  position: 'Guard',
};

export const mockPlayerShoheiData: Player = {
  id: 'player2',
  name: 'Shohei Ohtani',
  sport: 'Baseball',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  team: 'Los Angeles Dodgers',
  position: 'Pitcher/Designated Hitter',
};

export let mockPlayers: Player[] = [mockPlayerLukaData, mockPlayerShoheiData];

export let mockPlayerChatMessages: PlayerChatMessage[] = [
  {
    id: 'chatmsg1',
    player: mockPlayerLukaData,
    author: mockUser1Data,
    message: 'Luka is a fantasy beast! Triple-double machine.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'chatmsg2',
    player: mockPlayerLukaData,
    author: mockIdentityAnalystProData,
    message: 'His usage rate is off the charts. Consistently a top performer.',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export const availableSports: string[] = ['Basketball', 'Football', 'Baseball', 'Hockey', 'Soccer', 'Tennis', 'Golf'];
export const sportInterestLevels: SportInterestLevel[] = ['very interested', 'somewhat interested', 'no interest'];

// Expose the original mockUser1 and mockUser2 for AuthContext default or other direct uses if needed.
export const mockUser1 = mockUser1Data;
export const mockUser2 = mockUser2Data;
export const mockIdentityAnalystPro = mockIdentityAnalystProData;
export const mockIdentityFanaticBrand = mockIdentityFanaticBrandData;

    