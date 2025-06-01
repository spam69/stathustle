
import type { User, Post, Blog, Player, PlayerChatMessage, SportInterest, Comment, Identity, ReactionEntry, Notification, NotificationType } from '@/types';
import type { ReactionType } from '@/lib/reactions';

// Make mock data mutable for API route simulation
let mockUser1Data: User = {
  id: 'user1',
  username: 'FantasyFanatic',
  email: 'fanatic@stathustle.com',
  password: 'password123',
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
  password: 'password456',
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

const mockAdminUserData: User = {
  id: 'admin-user',
  username: 'admin',
  email: 'admin@email.com',
  password: 'admin',
  profilePictureUrl: 'https://placehold.co/200x200.png?text=Admin',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=AdminBanner',
  sportInterests: [
    { sport: 'Basketball', level: 'very interested' },
    { sport: 'Football', level: 'very interested' },
    { sport: 'Baseball', level: 'very interested' },
    { sport: 'Hockey', level: 'very interested' },
  ],
  themePreference: 'system',
  bio: 'Administrator account for StatHustle.',
  isIdentity: false,
};

export let mockUsers: User[] = [mockUser1Data, mockUser2Data, mockAdminUserData];

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
  detailedReactions: [
    { userId: mockUser1Data.id, reactionType: 'like', createdAt: new Date().toISOString() }
  ],
};

const mockReply1_to_comment1_post1: Comment = {
  id: 'reply1-to-comment1-post1',
  author: mockUser1Data,
  content: 'Thanks! Player Z is a good call, solid potential.',
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  parentId: 'comment1-post1',
  detailedReactions: [],
};

const mockReply2_to_comment1_post1: Comment = {
  id: 'reply2-to-comment1-post1',
  author: mockUser2Data, // Changed to User2Data to test reply notifications
  content: 'Definitely! Watched some film on him, looks promising.',
  createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  parentId: 'comment1-post1',
  detailedReactions: [],
};

const mockComment2_post1: Comment = {
  id: 'comment2-post1',
  author: mockAdminUserData, // Admin comments on User1's post
  content: 'Any thoughts on Player X? Seems a bit overrated to me this year.',
  createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  detailedReactions: [
     { userId: mockUser2Data.id, reactionType: 'haha', createdAt: new Date().toISOString() }
  ],
};

const mockComment1_post3: Comment = {
  id: 'comment1-post3',
  author: mockUser2Data,
  content: 'That game was epic! Still buzzing from it.',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
  detailedReactions: [
    { userId: mockUser1Data.id, reactionType: 'love', createdAt: new Date().toISOString() },
    { userId: mockAdminUserData.id, reactionType: 'wow', createdAt: new Date().toISOString() }
  ],
};

const originalPostForSharing1: Post = {
  id: 'original-post-1',
  author: mockUser1Data, // User 1
  content: 'This is an original post by FantasyFanatic about the importance of weekly waiver wire pickups. Never underestimate them! #FantasyStrategy',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(), 
  detailedReactions: [{ userId: mockUser2Data.id, reactionType: 'like', createdAt: new Date().toISOString() }],
  shares: 5,
  repliesCount: 1,
  comments: [{
    id: 'comment-op1',
    author: mockUser2Data,
    content: 'Totally agree, waiver wire is key!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 99).toISOString(),
    detailedReactions: []
  }],
  tags: ['#FantasyFootball', '#WaiverWire']
};

const originalPostForSharing2: Post = {
  id: 'original-post-2',
  author: mockIdentityAnalystProData, // Identity 1 (owned by User 2)
  content: 'Just published a new blog on breakout candidates for the second half of the MLB season. Check it out on my profile! ⚾️ #MLB #FantasyBaseball @AnalystPro',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
  detailedReactions: [
    { userId: mockUser1Data.id, reactionType: 'wow', createdAt: new Date().toISOString() },
    { userId: mockAdminUserData.id, reactionType: 'like', createdAt: new Date().toISOString() }
  ],
  shares: 12,
  repliesCount: 0,
  comments: [],
  mediaUrl: 'https://placehold.co/500x300.png',
  mediaType: 'image',
  tags: ['#MLBAnalysis']
};

const adminPost1: Post = {
  id: 'admin-post-1',
  author: mockAdminUserData, // Admin User
  content: 'Exciting new features coming soon to StatHustle! Stay tuned for updates. #PlatformNews',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  detailedReactions: [
      { userId: mockUser1Data.id, reactionType: 'like', createdAt: new Date().toISOString() },
      { userId: mockUser2Data.id, reactionType: 'wow', createdAt: new Date().toISOString() }
  ],
  shares: 2,
  repliesCount: 0,
  comments: [],
};


export let mockPosts: Post[] = [
  originalPostForSharing1,
  originalPostForSharing2,
  adminPost1, // Add admin's post
  {
    id: 'post1',
    author: mockUser1Data, // User 1
    content: 'Just drafted my fantasy basketball team! Feeling good about this season. 🏀 Who do you think is a sleeper pick this year? #FantasyBasketball #NBA',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    detailedReactions: [
        { userId: mockUser2Data.id, reactionType: 'like', createdAt: new Date().toISOString() },
        { userId: mockAdminUserData.id, reactionType: 'love', createdAt: new Date().toISOString() }
    ],
    shares: 3,
    repliesCount: 4,
    comments: [mockComment1_post1, mockReply1_to_comment1_post1, mockReply2_to_comment1_post1, mockComment2_post1],
    mediaUrl: 'https://placehold.co/600x400.png',
    mediaType: 'image',
    tags: ['@FantasyPlayerX', '#FantasyBasketball']
  },
  {
    id: 'post2',
    author: mockIdentityAnalystProData, // Identity 1 (owned by User 2)
    content: "<b>Deep Dive Analysis (posted as @AnalystPro)</b>: Top 5 NFL quarterbacks to watch for MVP contention. My projections are looking interesting! 🏈 <i>Full blog post coming soon!</i>",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    detailedReactions: [],
    shares: 10,
    repliesCount: 0,
    comments: [],
    teamSnapshot: { teamName: 'GridironGurus', players: ['QB1', 'RB1', 'WR1'] },
    tags: ['#NFLAnalysis', '#FantasyFootball']
  },
  {
    id: 'post3',
    author: mockUser1Data, // User 1
    content: "Anyone else catch that amazing hockey game last night? The overtime goal was insane! 🏒🥅 #NHL #HockeyHighlights",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    detailedReactions: [
        { userId: mockUser2Data.id, reactionType: 'wow', createdAt: new Date().toISOString() }
    ],
    shares: 1,
    repliesCount: 1,
    comments: [mockComment1_post3],
    mediaUrl: 'https://placehold.co/400x225.png',
    mediaType: 'gif',
    tags: ['#Hockey']
  },
  {
    id: 'share-post-1',
    author: mockUser2Data, // User2 is sharing originalPostForSharing1 (by User1)
    content: 'Absolutely crucial advice from @FantasyFanatic! Everyone should read this.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), 
    detailedReactions: [{ userId: mockAdminUserData.id, reactionType: 'like', createdAt: new Date().toISOString() }],
    shares: 0,
    repliesCount: 0,
    comments: [],
    sharedOriginalPostId: originalPostForSharing1.id,
  },
  {
    id: 'share-post-2',
    author: mockAdminUserData, // Admin is sharing originalPostForSharing2 (by Identity1/User2)
    content: 'Top-notch MLB insights from @AnalystPro as always. Highly recommend their work!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    detailedReactions: [{ userId: mockUser1Data.id, reactionType: 'love', createdAt: new Date().toISOString() }],
    shares: 0,
    repliesCount: 0,
    comments: [],
    sharedOriginalPostId: originalPostForSharing2.id,
    sharedOriginalPost: originalPostForSharing2, 
  },
  {
    id: 'share-post-3-no-preload',
    author: mockUser1Data, // User1 sharing originalPostForSharing2 (by Identity1/User2)
    content: 'Checking out this great MLB analysis by @AnalystPro!',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    detailedReactions: [],
    shares: 0,
    repliesCount: 0,
    comments: [],
    sharedOriginalPostId: originalPostForSharing2.id,
  },
  {
    id: 'post-extra-1',
    author: mockUser1Data,
    content: 'Thinking about starting a new fantasy league. What platform do you all prefer and why? #FantasySports #LeagueCommish',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    detailedReactions: [], shares: 0, repliesCount: 0, comments: [],
  },
  {
    id: 'post-extra-2',
    author: mockUser2Data,
    content: 'The trade deadline is approaching in my main league. Any bold predictions? #FantasyTrade #DeadlineDay',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    detailedReactions: [], shares: 0, repliesCount: 0, comments: [], mediaUrl: 'https://placehold.co/600x350.png', mediaType: 'image'
  },
  {
    id: 'post-extra-3',
    author: mockIdentityFanaticBrandData,
    content: 'Just posted as FanaticInsights: My weekly NFL player rankings are up! Who is too high, who is too low? Let me know! #NFLRankings #FantasyFootball',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
    detailedReactions: [], shares: 3, repliesCount: 0, comments: [],
  },
  {
    id: 'post-extra-4',
    author: mockAdminUserData,
    content: 'Welcome to all new StatHustle users! We are excited to have you. Explore the features and start hustling those stats!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    detailedReactions: [], shares: 1, repliesCount: 0, comments: [],
  },
];

mockPosts.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


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

export const mockPlayerPatrickMahomesData: Player = {
  id: 'player3',
  name: 'Patrick Mahomes',
  sport: 'Football',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  team: 'Kansas City Chiefs',
  position: 'Quarterback',
};

export const mockPlayerConnorMcDavidData: Player = {
  id: 'player4',
  name: 'Connor McDavid',
  sport: 'Hockey',
  profilePictureUrl: 'https://placehold.co/200x200.png',
  team: 'Edmonton Oilers',
  position: 'Center',
};


export let mockPlayers: Player[] = [
    mockPlayerLukaData,
    mockPlayerShoheiData,
    mockPlayerPatrickMahomesData,
    mockPlayerConnorMcDavidData
];

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

export let mockNotifications: Notification[] = [];

// Helper to generate actor display name
const getActorDisplayName = (actor: User | Identity) => {
  return actor.isIdentity ? (actor as Identity).displayName || actor.username : actor.username;
};

// Helper function to create and add notifications
export const createNotification = (
  type: NotificationType,
  actor: User | Identity,
  recipientUserId: string,
  post?: Post,
  comment?: Comment,
  originalComment?: Comment 
): void => {
  if (actor.id === recipientUserId) return; // Don't notify user for their own actions

  let message = '';
  let link = `/profile/${recipientUserId}`; // Default link, should be overridden

  const actorName = `<strong>${getActorDisplayName(actor)}</strong>`;
  const postContentPreview = post?.content ? `"${post.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your post';
  const commentContentPreview = comment?.content ? `"${comment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your comment';
  const originalCommentContentPreview = originalComment?.content ? `"${originalComment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your comment';


  switch (type) {
    case 'new_reaction_post':
      message = `${actorName} reacted to ${postContentPreview}.`;
      // For now, a simple link. This needs to be more robust.
      if (post) link = `/profile/${post.author.username}`; // Simplistic link, needs to go to the post
      break;
    case 'new_comment':
      message = `${actorName} commented on ${postContentPreview}: ${commentContentPreview}`;
      if (post) link = `/profile/${post.author.username}`;
      break;
    case 'new_reply':
      message = `${actorName} replied to ${originalCommentContentPreview}: ${commentContentPreview}`;
      if (post && originalComment) link = `/profile/${post.author.username}`;
      else if (post) link = `/profile/${post.author.username}`;
      break;
    case 'new_reaction_comment':
      message = `${actorName} reacted to your comment: ${commentContentPreview}`;
      if (post && comment) link = `/profile/${post.author.username}`;
      else if (post) link = `/profile/${post.author.username}`;
      break;
  }

  const newNotification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    actor,
    recipientUserId,
    postId: post?.id,
    commentId: comment?.id,
    originalCommentId: originalComment?.id,
    message,
    link,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  const existingNotification = mockNotifications.find(n => 
    n.type === type && 
    n.actor.id === actor.id && 
    n.recipientUserId === recipientUserId &&
    n.postId === post?.id &&
    n.commentId === comment?.id &&
    n.originalCommentId === originalComment?.id
  );

  if (!existingNotification) {
    mockNotifications.unshift(newNotification); // Add to beginning only if not a duplicate action
  }
};

// --- Initialize some mock notifications ---
const postForAdminReaction = adminPost1; // Admin's post
const commentForAdminReply = mockComment2_post1; // Admin's comment on post1 (owned by user1)

// Ensure related posts/comments exist before creating notifications
if (postForAdminReaction) {
    createNotification('new_reaction_post', mockUser1Data, mockAdminUserData.id, postForAdminReaction);
    createNotification('new_comment', mockUser2Data, mockAdminUserData.id, postForAdminReaction, {
        id: `mockcomment-${Date.now()}`,
        author: mockUser2Data,
        content: 'This is a great update for admin!',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        detailedReactions: [],
    });
}

if (commentForAdminReply && mockPosts.find(p => p.id === 'post1')) {
    const parentPostForReply = mockPosts.find(p => p.id === 'post1')!;
    createNotification('new_reply', mockIdentityAnalystProData, mockAdminUserData.id, parentPostForReply, {
        id: `mockreply-${Date.now()}`,
        author: mockIdentityAnalystProData,
        content: 'Insightful point on Player X, admin.',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        detailedReactions: [],
        parentId: commentForAdminReply.id,
    }, commentForAdminReply);
    createNotification('new_reaction_comment', mockUser1Data, mockAdminUserData.id, parentPostForReply, commentForAdminReply);
}
// --- End of initializing mock notifications ---


export const mockUser1 = mockUser1Data;
export const mockUser2 = mockUser2Data;
export const mockAdminUser = mockAdminUserData;
export const mockIdentityAnalystPro = mockIdentityAnalystProData;
export const mockIdentityFanaticBrand = mockIdentityFanaticBrandData;
