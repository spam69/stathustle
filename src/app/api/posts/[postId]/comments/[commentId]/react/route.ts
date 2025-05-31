
import { NextResponse } from 'next/server';
import { mockPosts, mockAdminUser } from '@/lib/mock-data';
import type { ReactionEntry } from '@/types';
import type { ReactionType } from '@/lib/reactions';

export async function POST(
  request: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { postId, commentId } = params;
    const { reactionType } = (await request.json()) as { reactionType: ReactionType | null };
    
    // In a real app, get userId from session. For dev, using mockAdminUser.id
    const reactingUserId = mockAdminUser.id;

    const post = mockPosts.find(p => p.id === postId);
    if (!post || !post.comments) {
      return NextResponse.json({ message: 'Post or comments not found' }, { status: 404 });
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }

    if (!comment.detailedReactions) {
      comment.detailedReactions = [];
    }

    const existingReactionIndex = comment.detailedReactions.findIndex(
      r => r.userId === reactingUserId
    );

    if (reactionType === null) { // Request to unreact
      if (existingReactionIndex !== -1) {
        comment.detailedReactions.splice(existingReactionIndex, 1);
      }
    } else { // Request to react or change reaction
      if (existingReactionIndex !== -1) {
        if (comment.detailedReactions[existingReactionIndex].reactionType === reactionType) {
          comment.detailedReactions.splice(existingReactionIndex, 1);
        } else {
          comment.detailedReactions[existingReactionIndex].reactionType = reactionType;
          comment.detailedReactions[existingReactionIndex].createdAt = new Date().toISOString();
        }
      } else {
        const newReaction: ReactionEntry = {
          userId: reactingUserId,
          reactionType,
          createdAt: new Date().toISOString(),
        };
        comment.detailedReactions.push(newReaction);
      }
    }
    // The comment object within mockPosts is directly mutated.
    // We need to return the specific comment that was reacted to, or the whole post for client update.
    // For simplicity, returning the whole post.
    return NextResponse.json(post); 
  } catch (error) {
    console.error(`React to Comment API error for post ${params.postId}, comment ${params.commentId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
