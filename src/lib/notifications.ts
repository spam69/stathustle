import NotificationModel from '@/models/Notification.model';
import mongoose from 'mongoose';
import type { NotificationType, User, Identity, Post, Comment } from '@/types';

const getActorDisplayName = (actor: User | Identity) => {
  if ('displayName' in actor && actor.displayName) return actor.displayName;
  return actor.username;
};

export async function createNotification(
  type: NotificationType,
  actor: User | Identity,
  recipientId: string,
  recipientModel: 'User' | 'Identity',
  post?: Post,
  comment?: Comment,
  originalComment?: Comment
): Promise<void> {
  // Transform actor to ensure it has the correct structure
  const transformedActor = actor.isIdentity ? {
    ...actor,
    id: (actor as any)._id?.toString() || actor.id,
    username: actor.username || 'Unknown',
    displayName: actor.displayName || actor.username || 'Unknown',
    profilePictureUrl: actor.profilePictureUrl || '',
    isIdentity: true as const,
    email: actor.email,
    owner: (actor as Identity).owner,
    teamMembers: (actor as Identity).teamMembers || [],
  } : {
    ...actor,
    id: (actor as any)._id?.toString() || actor.id,
    username: actor.username || 'Unknown',
    displayName: actor.displayName || actor.username || 'Unknown',
    profilePictureUrl: actor.profilePictureUrl || '',
    isIdentity: false as const,
    email: actor.email,
    password: (actor as User).password,
    bannerImageUrl: (actor as User).bannerImageUrl,
    socialLinks: (actor as User).socialLinks || [],
    themePreference: (actor as User).themePreference,
    bio: (actor as User).bio,
    followers: (actor as User).followers || [],
    following: (actor as User).following || [],
  };

  if (!transformedActor.id) {
    console.warn('[Notifications] createNotification called with invalid actor:', actor);
    return;
  }

  if (transformedActor.id === recipientId && type.startsWith('new_reaction')) return;
  if (transformedActor.id === recipientId && type === 'new_follower') return;

  let message = '';
  let link = `/profile/${recipientId}`;
  const actorName = `<strong>${getActorDisplayName(transformedActor)}</strong>`;
  const postContentPreview = post?.content ? `"${post.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : (post ? 'your post' : 'content');
  let relevantCommentContentPreview = '';
  if (comment) {
    relevantCommentContentPreview = comment.content ? `"${comment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'a comment';
  }
  const originalCommentContentPreview = originalComment?.content ? `"${originalComment.content.substring(0, 30).replace(/<[^>]+>/g, '')}..."` : 'your comment';

  switch (type) {
    case 'new_reaction_post':
      message = `${actorName} reacted to ${postContentPreview}.`;
      if (post) link = `/profile/${post.author.username}?postId=${post.id}`;
      break;
    case 'new_comment':
      message = `${actorName} commented on ${postContentPreview}: ${relevantCommentContentPreview}`;
      if (post) link = `/profile/${post.author.username}?postId=${post.id}&commentId=${comment?.id}`;
      break;
    case 'new_reply':
      message = `${actorName} replied to ${originalCommentContentPreview}: ${relevantCommentContentPreview}`;
      if (post) link = `/profile/${post.author.username}?postId=${post.id}&commentId=${comment?.id}&replyTo=${originalComment?.id}`;
      break;
    case 'new_reaction_comment':
      message = `${actorName} reacted to ${relevantCommentContentPreview} on ${postContentPreview}.`;
      if (post) link = `/profile/${post.author.username}?postId=${post.id}&commentId=${comment?.id}`;
      break;
    case 'new_follower':
      message = `${actorName} started following you.`;
      link = `/profile/${transformedActor.username}`;
      break;
  }

  await NotificationModel.create({
    type,
    actor: new mongoose.Types.ObjectId(transformedActor.id),
    actorModel: transformedActor.isIdentity ? 'Identity' : 'User',
    recipientId: new mongoose.Types.ObjectId(recipientId),
    recipientModel,
    postId: post?.id ? new mongoose.Types.ObjectId(post.id) : undefined,
    commentId: comment?.id ? new mongoose.Types.ObjectId(comment.id) : undefined,
    originalCommentId: originalComment?.id ? new mongoose.Types.ObjectId(originalComment.id) : undefined,
    message,
    link,
    isRead: false,
  });
} 