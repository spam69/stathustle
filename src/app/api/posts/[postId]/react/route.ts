
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/mock-data';
import type { ReactionEntry, User as UserType, Identity as IdentityType, Post as PostType } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import { mockAdminUser } from '@/lib/mock-data'; // Placeholder for authenticated user

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = params;
    const { reactionType } = (await request.json()) as { reactionType: ReactionType | null };
    
    const reactingUserId = mockAdminUser.id; // Placeholder for actual authenticated user ID

    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }

    const post = await PostModel.findById(postId).populate('author'); // Populate author for notification check
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    let reactingUserDoc = await UserModel.findById(reactingUserId).lean() || await IdentityModel.findById(reactingUserId).lean();
    if (!reactingUserDoc) {
      return NextResponse.json({ message: 'Reacting user not found' }, { status: 404 });
    }

    if (!post.detailedReactions) {
      post.detailedReactions = [];
    }

    const existingReactionIndex = post.detailedReactions.findIndex(
      r => r.userId.toString() === reactingUserId
    );

    let previousReactionType: ReactionType | null = null;
    if (existingReactionIndex !== -1) {
      previousReactionType = post.detailedReactions[existingReactionIndex].reactionType;
    }

    if (reactionType === null) { // Unreact
      if (existingReactionIndex !== -1) {
        post.detailedReactions.splice(existingReactionIndex, 1);
      }
    } else { // React or change reaction
      if (existingReactionIndex !== -1) {
        if (post.detailedReactions[existingReactionIndex].reactionType === reactionType) { // Clicked same reaction
          post.detailedReactions.splice(existingReactionIndex, 1);
        } else { // Changed reaction
          post.detailedReactions[existingReactionIndex].reactionType = reactionType;
          post.detailedReactions[existingReactionIndex].createdAt = new Date();
        }
      } else { // New reaction
        post.detailedReactions.push({
          userId: reactingUserDoc._id, // Store ObjectId
          reactionType,
          createdAt: new Date(),
        } as unknown as ReactionEntry); // Cast needed if ReactionEntry in type expects string ID
      }
    }

    await post.save();

    // Populate author details for the returned post
    let populatedPost = post.toObject({ virtuals: true }) as PostType;
    if (post.author && post.authorModel) {
       const AuthorModel = post.authorModel === 'User' ? UserModel : IdentityModel;
       populatedPost.author = await AuthorModel.findById(post.author._id).lean() as UserType | IdentityType;
    }
    // Repopulate detailedReactions to ensure userIds are resolved if needed for response (though usually not)
    // For now, assuming client handles userId strings.

    // Notification logic
    if (post.author && reactingUserDoc._id.toString() !== post.author._id.toString()) {
      if (reactionType && reactionType !== previousReactionType) {
        // Need to fetch post.author fully if not already populated correctly
        const postAuthorDoc = post.author; // Assumes author was populated
        createNotification(
            'new_reaction_post', 
            reactingUserDoc as UserType | IdentityType, 
            postAuthorDoc._id.toString(), 
            populatedPost
        );
      }
    }
    
    // Populate author for response more thoroughly
    const finalPost = await PostModel.findById(post._id)
        .populate({ path: 'author', model: post.authorModel === 'User' ? UserModel : IdentityModel })
        .populate({ path: 'comments', populate: { path: 'author' }}) // basic comment author population
        .lean();

    if (finalPost && finalPost.author && finalPost.authorModel) {
        const AuthorModelPop = finalPost.authorModel === 'User' ? UserModel : IdentityModel;
        finalPost.author = await AuthorModelPop.findById(finalPost.author._id).lean() as UserType | IdentityType;
    }
    // This could be simplified if client can handle plain User IDs in reactions array.
    // For now, returning the post with populated author.


    return NextResponse.json({ ...finalPost, id: finalPost?._id.toString() });
  } catch (error: any) {
    console.error(`React to Post API error for post ${params.postId}:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
