
import { NextResponse } from 'next/server';
import { mockPosts, mockAdminUser, mockUsers, mockIdentities, createNotification } from '@/lib/mock-data'; 
import type { ReactionEntry, User, Identity } from '@/types';
import type { ReactionType } from '@/lib/reactions';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { reactionType } = (await request.json()) as { reactionType: ReactionType | null };
    
    // In a real app, get userId from session. For dev, using mockAdminUser.id
    const reactingUserId = mockAdminUser.id; 
    const reactingUser = mockUsers.find(u => u.id === reactingUserId) || mockIdentities.find(i => i.id === reactingUserId);


    const post = mockPosts.find(p => p.id === postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    if (!reactingUser) {
      return NextResponse.json({ message: 'Reacting user not found' }, { status: 404 });
    }

    if (!post.detailedReactions) {
      post.detailedReactions = [];
    }

    const existingReactionIndex = post.detailedReactions.findIndex(
      r => r.userId === reactingUserId
    );

    let previousReactionType: ReactionType | null = null;
    if(existingReactionIndex !== -1) {
      previousReactionType = post.detailedReactions[existingReactionIndex].reactionType;
    }

    if (reactionType === null) { // Request to unreact
      if (existingReactionIndex !== -1) {
        post.detailedReactions.splice(existingReactionIndex, 1);
      }
    } else { // Request to react or change reaction
      if (existingReactionIndex !== -1) {
        // User has an existing reaction
        if (post.detailedReactions[existingReactionIndex].reactionType === reactionType) {
          // Clicked the same reaction again, so remove it
          post.detailedReactions.splice(existingReactionIndex, 1);
        } else {
          // Changed reaction type
          post.detailedReactions[existingReactionIndex].reactionType = reactionType;
          post.detailedReactions[existingReactionIndex].createdAt = new Date().toISOString();
        }
      } else {
        // New reaction
        const newReaction: ReactionEntry = {
          userId: reactingUserId,
          reactionType,
          createdAt: new Date().toISOString(),
        };
        post.detailedReactions.push(newReaction);
      }
    }
    
    // Generate notification if it's a new reaction (not an un-react or same reaction click)
    // And if the reactor is not the post author
    if (reactionType && reactionType !== previousReactionType && post.author.id !== reactingUserId) {
        createNotification('new_reaction_post', reactingUser, post.author.id, post);
    }


    return NextResponse.json(post);
  } catch (error) {
    console.error(`React to Post API error for post ${params.postId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
