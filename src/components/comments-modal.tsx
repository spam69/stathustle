
"use client";

import { useState, useEffect, Fragment, useRef } from 'react';
import type { Post, Comment as CommentType, User, Identity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, Award, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button';
import { useFeed } from '@/contexts/feed-context';
import type { ReactionType } from '@/lib/reactions';

interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  // onCommentSubmit and onReactToComment are now primarily handled via useFeed context
  currentUser: User | Identity | null;
}

const getAuthorDisplayInfo = (author: User | Identity) => {
  const username = author.username;
  const displayName = 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const profilePictureUrl = author.profilePictureUrl;
  const isIdentity = 'isIdentity' in author && (author as Identity).isIdentity;
  return { username, displayName, profilePictureUrl, isIdentity };
};

const getInitials = (name: string = "") => {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
};

export default function CommentsModal({ post, isOpen, onClose, currentUser }: CommentsModalProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null); // Only for top-level comments
  const { toast } = useToast();
  const { 
    addCommentToFeedPost, 
    isCommenting, 
    reactToComment, 
    isReactingToComment,
    openCommentRepliesModal 
  } = useFeed();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewCommentText('');
      setReplyingTo(null);
    }
  }, [isOpen]);

  if (!post) return null;

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) {
      toast({ title: "Error", description: "Comment cannot be empty and you must be logged in.", variant: "destructive" });
      return;
    }
    // If replyingTo is set, its ID is the parentId (must be a top-level comment).
    // Otherwise, it's a new top-level comment.
    addCommentToFeedPost({ postId: post.id, content: newCommentText.trim(), parentId: replyingTo?.id });
    setNewCommentText('');
    setReplyingTo(null);
    // Toast for success/error is handled by FeedContext's useMutation
  };

  const startReplyToTopLevelComment = (commentToReply: CommentType) => {
    setReplyingTo(commentToReply); // This comment must be a top-level comment
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewCommentText(''); 
  };

  const handleReactToCommentClick = (commentId: string, reactionType: ReactionType | null) => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please login to react to comments.", variant: "destructive"});
        return;
    }
    reactToComment({ postId: post.id, commentId, reactionType });
  };

  const handleOpenRepliesModal = (topLevelComment: CommentType) => {
    openCommentRepliesModal(post, topLevelComment);
  };

  const renderTopLevelComment = (comment: CommentType) => {
    const authorInfo = getAuthorDisplayInfo(comment.author);
    const directReplies = (post.comments || []).filter(reply => reply.parentId === comment.id);
    const repliesCount = directReplies.length;

    return (
      <div key={comment.id} className="py-3 border-b border-border/30 last:border-b-0">
        <div className="flex items-start gap-2 sm:gap-3">
          <Link href={`/profile/${authorInfo.username}`} passHref>
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border">
              <AvatarImage src={authorInfo.profilePictureUrl} alt={authorInfo.displayName} />
              <AvatarFallback>{getInitials(authorInfo.displayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Link href={`/profile/${authorInfo.username}`} passHref>
                  <span className="text-xs font-semibold hover:underline font-headline">{authorInfo.displayName}</span>
                </Link>
                {authorInfo.isIdentity && <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0"><Award className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5"/>Id</Badge>}
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mb-1">{comment.content}</p>
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
              <ReactionButton
                reactions={comment.detailedReactions}
                onReact={(reactionType) => handleReactToCommentClick(comment.id, reactionType)}
                currentUserId={currentUser?.id}
                isSubmitting={isReactingToComment}
                buttonSize="xs"
                popoverSide="bottom"
              />
              <Button variant="ghost" size="xs" className="p-1 h-auto text-muted-foreground" onClick={() => startReplyToTopLevelComment(comment)} disabled={!currentUser}>
                <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="ml-1 text-[10px] sm:text-xs">Reply</span>
              </Button>
              {repliesCount > 0 && (
                 <Button variant="ghost" size="xs" className="p-1 h-auto text-primary" onClick={() => handleOpenRepliesModal(comment)}>
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1"/> {repliesCount} {repliesCount === 1 ? 'Reply' : 'Replies'}
                 </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const topLevelComments = (post.comments || [])
    .filter(comment => !comment.parentId) 
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const currentUserInfo = currentUser ? getAuthorDisplayInfo(currentUser) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[calc(100vh_-_4rem)] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="font-headline">Comments on {getAuthorDisplayInfo(post.author).displayName}'s post</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-4">
            {topLevelComments.length > 0 ? (
              topLevelComments.map(comment => renderTopLevelComment(comment))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
            )}
        </ScrollArea>

        {currentUserInfo ? (
          <DialogFooter className="p-4 border-t bg-background shrink-0">
            <form onSubmit={handleMainSubmit} className="w-full space-y-2">
              {replyingTo && (
                <div className="text-xs text-muted-foreground flex justify-between items-center">
                  <span>Replying to <span className="font-semibold">@{getAuthorDisplayInfo(replyingTo.author).displayName}</span></span>
                  <Button variant="ghost" size="xs" onClick={cancelReply} type="button" className="p-1 h-auto text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3 mr-1"/> Cancel
                  </Button>
                </div>
              )}
              <div className="flex items-start gap-2">
                 <Avatar className="h-9 w-9 border mt-1 shrink-0">
                  <AvatarImage src={currentUserInfo.profilePictureUrl} alt={currentUserInfo.displayName} />
                  <AvatarFallback>{getInitials(currentUserInfo.displayName)}</AvatarFallback>
                </Avatar>
                <Textarea
                  ref={commentInputRef}
                  placeholder={replyingTo ? `Reply to @${getAuthorDisplayInfo(replyingTo.author).displayName}...` : "Write a comment..."}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="min-h-[60px] flex-1"
                  maxLength={500}
                  rows={2}
                  disabled={isCommenting}
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isCommenting || !newCommentText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </DialogFooter>
        ) : (
          <DialogFooter className="p-4 border-t shrink-0">
             <p className="text-sm text-muted-foreground text-center w-full">
                Please <Link href="/login" className="underline text-primary">login</Link> to comment.
             </p>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

    