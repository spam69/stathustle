
import type { User, Post, Blog, Player, PlayerChatMessage, SportInterest, Comment, Identity, ReactionEntry, Notification, NotificationType } from '@/types';
import type { ReactionType } from '@/lib/reactions';

// Make mock data mutable for API route simulation
let mockUser1Data: User = {
  id: 'user1',
  username: 'FantasyFanatic',
  email: 'fanatic@stathustle.com',
  password: 'password123',
  profilePictureUrl: 'https://placehold.co/200x200.png?text=U1',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=Banner1',
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
  profilePictureUrl: 'https://placehold.co/200x200.png?text=U2',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=Banner2',
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
  profilePictureUrl: 'https://placehold.co/200x200.png?text=Adm',
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
  profilePictureUrl: 'https://placehold.co/200x200.png?text=ID1',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=IDBanner1',
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
  profilePictureUrl: 'https://placehold.co/200x200.png?text=ID2',
  bannerImageUrl: 'https://placehold.co/1200x300.png?text=IDBanner2',
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

const mockAdminComment_on_post1: Comment = {
  id: 'admin-comment-post1',
  author: mockAdminUserData,
  content: 'Any thoughts on Player X? Seems a bit overrated to me this year. What does everyone else think?',
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
  author: mockUser1Data,
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
  author: mockIdentityAnalystProData,
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
  author: mockAdminUserData,
  content: 'Exciting new features coming soon to StatHustle! Stay tuned for updates. #PlatformNews',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  detailedReactions: [
      { userId: mockUser1Data.id, reactionType: 'like', createdAt: new Date().toISOString() },
      { userId: mockUser2Data.id, reactionType: 'wow', createdAt: new Date().toISOString() }
  ],
  shares: 2,
  repliesCount: 1, 
  comments: [
    {
        id: 'comment-ap1',
        author: mockUser1Data,
        content: 'Looking forward to the updates, Admin!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        detailedReactions: []
    }
  ],
};


export let mockPosts: Post[] = [
  originalPostForSharing1,
  originalPostForSharing2,
  adminPost1,
  {
    id: 'post1',
    author: mockUser1Data,
    content: 'Just drafted my fantasy basketball team! Feeling good about this season. 🏀 Who do you think is a sleeper pick this year? #FantasyBasketball #NBA',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    detailedReactions: [
        { userId: mockUser2Data.id, reactionType: 'like', createdAt: new Date().toISOString() },
        { userId: mockAdminUserData.id, reactionType: 'love', createdAt: new Date().toISOString() }
    ],
    shares: 3,
    repliesCount: 3,
    comments: [mockComment1_post1, mockReply1_to_comment1_post1, mockAdminComment_on_post1],
    mediaUrl: 'https://placehold.co/600x400.png',
    mediaType: 'image',
    tags: ['@FantasyPlayerX', '#FantasyBasketball']
  },
  {
    id: 'post2',
    author: mockIdentityAnalystProData,
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
    author: mockUser1Data,
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
    author: mockUser2Data,
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
    author: mockAdminUserData,
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
    author: mockUser1Data,
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
    detailedReactions: [{userId: mockAdminUserData.id, reactionType: "like", createdAt: new Date().toISOString()}], shares: 3, repliesCount: 0, comments: [],
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

const getActorDisplayName = (actor: User | Identity) => {
  if (!actor) return 'Unknown Actor';
  return actor.isIdentity ? (actor as Identity).displayName || actor.username : actor.username;
};

export const createNotification = (
  type: NotificationType,
  actor: User | Identity,
  recipientUserId: string,
  post?: Post,
  comment?: Comment, 
  originalComment?: Comment 
): void => {
  if (!actor || !actor.id) {
    console.warn('[MockData] createNotification called with invalid actor:', actor);
    return; 
  }
  if (actor.id === recipientUserId && type !== 'new_comment' && type !== 'new_reply') { 
    // Allow users to get notifs for their own comments/replies on their own posts for testing, but not self-reactions
    if (type.startsWith('new_reaction')) return;
  }

  const existingNotificationIndex = mockNotifications.findIndex(n =>
    n.type === type &&
    n.actor.id === actor.id &&
    n.recipientUserId === recipientUserId &&
    n.postId === post?.id &&
    n.commentId === comment?.id &&
    n.originalCommentId === originalComment?.id
  );

  if (existingNotificationIndex !== -1) {
    return;
  }

  let message = '';
  let link = `/profile/${recipientUserId}`; // Default link

  const actorName = `<strong>${getActorDisplayName(actor)}</strong>`;
  const postContentPreview = post?.content ? `"${post.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your post';
  
  let relevantCommentContentPreview = '';
  if (type === 'new_comment' && comment) {
    relevantCommentContentPreview = comment.content ? `"${comment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'a comment';
  } else if (type === 'new_reply' && comment) { 
    relevantCommentContentPreview = comment.content ? `"${comment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'a reply';
  } else if (type === 'new_reaction_comment' && comment) { 
    relevantCommentContentPreview = comment.content ? `"${comment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your comment';
  } else {
    relevantCommentContentPreview = 'your comment';
  }

  const originalCommentContentPreview = originalComment?.content ? `"${originalComment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your comment';


  switch (type) {
    case 'new_reaction_post':
      message = `${actorName} reacted to ${postContentPreview}.`;
      if (post) link = `/profile/${post.author.username}`; // Simplified link for now
      break;
    case 'new_comment':
      message = `${actorName} commented on ${postContentPreview}: ${relevantCommentContentPreview}`;
      if (post) link = `/profile/${post.author.username}`;
      break;
    case 'new_reply':
      message = `${actorName} replied to ${originalCommentContentPreview}: ${relevantCommentContentPreview}`;
      if (post) link = `/profile/${post.author.username}`;
      break;
    case 'new_reaction_comment':
      message = `${actorName} reacted to ${relevantCommentContentPreview} on ${postContentPreview}.`;
      if (post) link = `/profile/${post.author.username}`;
      break;
  }

  const newNotification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${mockNotifications.length}`,
    type,
    actor,
    recipientUserId,
    postId: post?.id,
    commentId: comment?.id,
    originalCommentId: originalComment?.id,
    message,
    link,
    createdAt: new Date(Date.now() - mockNotifications.length * 1000 * 60 * Math.random()*5).toISOString(), // Stagger time for realism
    isRead: Math.random() > 0.7, // Randomly mark some as read
  };

  mockNotifications.unshift(newNotification);
};


// --- Initialize many mock notifications for admin-user ---
const adminP = mockPosts.find(p => p.id === 'admin-post-1');
const anotherAdminP = mockPosts.find(p => p.id === 'post-extra-4');
const post1ForAdminC = mockPosts.find(p => p.id === 'post1');
const adminCommentOnP1 = post1ForAdminC?.comments?.find(c => c.id === 'admin-comment-post1');

if (!adminP) console.error("[MOCK DATA ERROR] Could not find adminPostForNotifs ('admin-post-1')");
if (!anotherAdminP) console.error("[MOCK DATA ERROR] Could not find anotherAdminPostForNotifs ('post-extra-4')");
if (!post1ForAdminC) console.error("[MOCK DATA ERROR] Could not find post1ForAdminComment ('post1')");
if (!adminCommentOnP1) console.error("[MOCK DATA ERROR] Could not find adminCommentOnPost1 ('admin-comment-post1')");


const usersAndIdentities: (User | Identity)[] = [
  mockUser1Data,
  mockUser2Data,
  mockIdentityAnalystProData,
  mockIdentityFanaticBrandData
];
const reactionTypes: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

// Generate notifications for adminPostForNotifs (authored by admin)
if (adminP) {
  for (let i = 0; i < 7; i++) { // Reduced for brevity, increase for more
    const randomActor = usersAndIdentities[i % usersAndIdentities.length];
    
    createNotification('new_reaction_post', randomActor, mockAdminUserData.id, adminP);
    
    const mockComment: Comment = {
      id: `mockcomment-adminpost-${i}-${Date.now()}`,
      author: randomActor,
      content: `This is comment #${i+1} on admin's post ("${adminP.content.substring(0,20)}...") by ${getActorDisplayName(randomActor)}.`,
      createdAt: new Date(Date.now() - (i * 1000 * 60 * (10 + i))).toISOString(),
      detailedReactions: [],
    };
    createNotification('new_comment', randomActor, mockAdminUserData.id, adminP, mockComment);
    if (!adminP.comments) adminP.comments = [];
    adminP.comments.push(mockComment);
    adminP.repliesCount = (adminP.repliesCount || 0) + 1;
  }
}

// Generate notifications for anotherAdminPostForNotifs (authored by admin)
if (anotherAdminP) {
   for (let i = 0; i < 6; i++) { // Reduced
    const randomActor = usersAndIdentities[i % usersAndIdentities.length];
     createNotification('new_reaction_post', randomActor, mockAdminUserData.id, anotherAdminP);
   }
}

// Generate notifications related to admin's comment (adminCommentOnPost1 on post1)
if (adminCommentOnP1 && post1ForAdminC) {
  for (let i = 0; i < 8; i++) { // Reduced
    const randomActor = usersAndIdentities[i % usersAndIdentities.length];

    createNotification('new_reaction_comment', randomActor, mockAdminUserData.id, post1ForAdminC, adminCommentOnP1);
    
    const mockReply: Comment = {
      id: `mockreply-admincomment-${i}-${Date.now()}`,
      author: randomActor,
      content: `This is reply #${i+1} to admin's comment ("${adminCommentOnP1.content.substring(0,20)}...") by ${getActorDisplayName(randomActor)}.`,
      createdAt: new Date(Date.now() - (i * 1000 * 60 * (7 + i))).toISOString(),
      parentId: adminCommentOnP1.id,
      detailedReactions: [],
    };
    createNotification('new_reply', randomActor, mockAdminUserData.id, post1ForAdminC, mockReply, adminCommentOnP1);
    if (!post1ForAdminC.comments) post1ForAdminC.comments = [];
    post1ForAdminC.comments.push(mockReply);
    post1ForAdminC.repliesCount = (post1ForAdminC.repliesCount || 0) + 1;
  }
}

// Add a few more very recent notifications
if (adminP) {
    createNotification('new_comment', mockUser1Data, mockAdminUserData.id, adminP, {id: `lastminutecomment-${Date.now()}`, author: mockUser1Data, content: "A very recent comment!", createdAt: new Date(Date.now() - 1000*10).toISOString(), detailedReactions:[]});
}
if (anotherAdminP) {
    createNotification('new_reaction_post', mockUser2Data, mockAdminUserData.id, anotherAdminP);
}


mockNotifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
console.log(`[MockData] Initialized. Total mockNotifications: ${mockNotifications.length}. For admin (${mockAdminUserData.id}): ${mockNotifications.filter(n=>n.recipientUserId === mockAdminUserData.id).length}`);
// --- End of initializing mock notifications ---


export const mockUser1 = mockUser1Data;
export const mockUser2 = mockUser2Data;
export const mockAdminUser = mockAdminUserData;
export const mockIdentityAnalystPro = mockIdentityAnalystProData;
export const mockIdentityFanaticBrand = mockIdentityFanaticBrandData;
