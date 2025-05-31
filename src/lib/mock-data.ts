
import type { User, Post, Blog, Player, PlayerChatMessage, SportInterest, Comment } from '@/types';

export const mockUser1: User = {
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
};

export const mockUser2: User = {
  id: 'user2',
  username: 'AnalystPro',
  email: 'pro@stathustle.com',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  bannerImageUrl: 'https://placehold.co/1200x300.png',
  sportInterests: [
    { sport: 'Baseball', level: 'very interested' },
    { sport: 'Hockey', level: 'very interested' },
  ],
  themePreference: 'dark',
  bio: 'Professional sports analyst providing top-tier insights.',
};

export const mockUsers: User[] = [mockUser1, mockUser2];

const mockComment1_post1: Comment = {
  id: 'comment1-post1',
  author: mockUser2,
  content: 'Great point about sleeper picks! I am keeping an eye on Player Z.',
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  likes: 5,
};

const mockReply1_to_comment1_post1: Comment = {
  id: 'reply1-to-comment1-post1',
  author: mockUser1,
  content: 'Thanks! Player Z is a good call, solid potential.',
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  parentId: 'comment1-post1',
  likes: 2,
};

const mockReply2_to_comment1_post1: Comment = {
  id: 'reply2-to-comment1-post1',
  author: mockUser2,
  content: 'Definitely! Watched some film on him, looks promising.',
  createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
  parentId: 'comment1-post1',
  likes: 1,
};

const mockComment2_post1: Comment = {
  id: 'comment2-post1',
  author: mockUser1,
  content: 'Any thoughts on Player X? Seems a bit overrated to me this year.',
  createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
  likes: 3,
};


const mockComment1_post3: Comment = {
  id: 'comment1-post3',
  author: mockUser2,
  content: 'That game was epic! Still buzzing from it.',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
  likes: 10,
};


export const mockPosts: Post[] = [
  {
    id: 'post1',
    author: mockUser1,
    content: 'Just drafted my fantasy basketball team! Feeling good about this season. 🏀 Who do you think is a sleeper pick this year? #FantasyBasketball #NBA',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    reactions: 15,
    shares: 3,
    // Total comments and replies for post1: mockComment1_post1, mockReply1_to_comment1_post1, mockReply2_to_comment1_post1, mockComment2_post1 = 4
    repliesCount: 4, 
    comments: [mockComment1_post1, mockReply1_to_comment1_post1, mockReply2_to_comment1_post1, mockComment2_post1],
    mediaUrl: 'https://placehold.co/600x400.png',
    mediaType: 'image',
    tags: ['@FantasyPlayerX', '#FantasyBasketball']
  },
  {
    id: 'post2',
    author: mockUser2,
    content: "<b>Deep Dive Analysis</b>: Top 5 NFL quarterbacks to watch for MVP contention. My projections are looking interesting! 🏈 <i>Full blog post coming soon!</i>",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    reactions: 42,
    shares: 10,
    repliesCount: 0,
    comments: [],
    teamSnapshot: { teamName: 'GridironGurus', players: ['QB1', 'RB1', 'WR1'] },
    tags: ['#NFLAnalysis', '#FantasyFootball']
  },
  {
    id: 'post3',
    author: mockUser1,
    content: "Anyone else catch that amazing hockey game last night? The overtime goal was insane! 🏒🥅 #NHL #HockeyHighlights",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    reactions: 22,
    shares: 1,
    repliesCount: 1, // mockComment1_post3
    comments: [mockComment1_post3],
    mediaUrl: 'https://placehold.co/400x225.png', 
    mediaType: 'gif',
    tags: ['#Hockey']
  },
];

export const mockBlogs: Blog[] = [
  {
    id: 'blog1',
    author: mockUser2,
    title: 'The Undervalued Stars of MLB: A Statistical Breakdown',
    slug: 'undervalued-mlb-stars',
    excerpt: 'Discover which MLB players are outperforming their fantasy value based on advanced metrics. My analysis points to some key pickups...',
    content: '<p>Full blog content here... discussing advanced stats like wOBA, FIP, and xBA for several players. Includes charts and tables.</p><img src="https://placehold.co/800x400.png" alt="MLB Stats Chart" data-ai-hint="baseball statistics" /> <p>More analysis follows...</p>',
    coverImageUrl: 'https://placehold.co/800x450.png',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'blog2',
    author: mockUser1,
    title: 'My Top 10 Fantasy Basketball Draft Picks for 2024',
    slug: 'top-10-fantasy-basketball-2024',
    excerpt: 'Get ready for your fantasy basketball draft! Here are my top 10 must-have players for the upcoming season, complete with rationale...',
    content: '<p>Detailed analysis of 10 basketball players, their strengths, weaknesses, and fantasy outlook. </p> <p>Inline images can be added here for each player.</p>',
    coverImageUrl: 'https://placehold.co/800x450.png',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
];

export const mockPlayerLuka: Player = {
  id: 'player1',
  name: 'Luka Doncic',
  sport: 'Basketball',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  team: 'Dallas Mavericks',
  position: 'Guard',
};

export const mockPlayerShohei: Player = {
  id: 'player2',
  name: 'Shohei Ohtani',
  sport: 'Baseball',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  team: 'Los Angeles Dodgers',
  position: 'Pitcher/Designated Hitter',
};

export const mockPlayers: Player[] = [mockPlayerLuka, mockPlayerShohei];

export const mockPlayerChatMessages: PlayerChatMessage[] = [
  {
    id: 'chatmsg1',
    player: mockPlayerLuka,
    author: mockUser1,
    message: 'Luka is a fantasy beast! Triple-double machine.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
  {
    id: 'chatmsg2',
    player: mockPlayerLuka,
    author: mockUser2,
    message: 'His usage rate is off the charts. Consistently a top performer.',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
  },
];

export const availableSports: string[] = ['Basketball', 'Football', 'Baseball', 'Hockey', 'Soccer', 'Tennis', 'Golf'];
export const sportInterestLevels: SportInterestLevel[] = ['very interested', 'somewhat interested', 'no interest'];
