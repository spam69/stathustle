
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Post, Comment as CommentType, User, Identity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Award, X, Smile } from 'lucide-react'; // Added Smile
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button';
import { useFeed } from '@/contexts/feed-context';
import type { ReactionType } from '@/lib/reactions';
import { useAuth } from '@/contexts/auth-context';
import React from 'react'; // Import React for Fragment
import { parseMentions } from '@/lib/text-processing'; // Import for parsing mentions
import EmojiPicker from './emoji-picker'; // Import EmojiPicker

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

export default function CommentRepliesModal() {
  const {
    isCommentRepliesModalOpen,
    closeCommentRepliesModal,
    activeCommentForReplies,
    addCommentToFeedPost,
    isCommenting,
    reactToComment,
    isReactingToComment
  } = useFeed();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [newReplyText, setNewReplyText] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isCommentRepliesModalOpen) {
      setNewReplyText('');
    }
  }, [isCommentRepliesModalOpen]);

  if (!isCommentRepliesModalOpen || !activeCommentForReplies || !currentUser) {
    return null;
  }

  const { post, topLevelComment } = activeCommentForReplies;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim()) {
      toast({ title: "Error", description: "Reply cannot be empty.", variant: "destructive" });
      return;
    }
    addCommentToFeedPost({
      postId: post.id,
      content: newReplyText.trim(),
      parentId: topLevelComment.id,
    });
    setNewReplyText('');
  };

  const handleReactToSpecificComment = (commentId: string, reactionType: ReactionType | null) => {
     if (!currentUser) {
        toast({ title: "Login Required", description: "Please login to react to comments.", variant: "destructive"});
        return;
    }
    reactToComment({ postId: post.id, commentId, reactionType });
  };

  const handleEmojiSelectForReply = (emoji: string) => {
    setNewReplyText(prev => prev + emoji);
    replyInputRef.current?.focus();
  };

  const directReplies = (post.comments || [])
    .filter(reply => reply.parentId === topLevelComment.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const topLevelCommentAuthorInfo = getAuthorDisplayInfo(topLevelComment.author);
  const currentUserInfo = getAuthorDisplayInfo(currentUser);
  const processedTopLevelCommentContent = parseMentions(topLevelComment.content);

  return (
    <Dialog open={isCommentRepliesModalOpen} onOpenChange={(open) => !open && closeCommentRepliesModal()}>
      <DialogContent className="sm:max-w-lg max-h-[calc(100vh_-_4rem)] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="font-headline">
            Replies to {topLevelCommentAuthorInfo.displayName}'s comment
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto px-4">
          <div className="py-3 border-b border-border/30 bg-muted/20 -mx-4 px-4 sticky top-0 z-10">
            <div className="flex items-start gap-2 sm:gap-3">
              <Link href={`/profile/${topLevelCommentAuthorInfo.username}`} passHref>
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={topLevelCommentAuthorInfo.profilePictureUrl} alt={topLevelCommentAuthorInfo.displayName} />
                  <AvatarFallback>{getInitials(topLevelCommentAuthorInfo.displayName)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                   <div className="flex items-center gap-1 sm:gap-1.5">
                    <Link href={`/profile/${topLevelCommentAuthorInfo.username}`} passHref>
                      <span className="text-sm font-semibold hover:underline font-headline">{topLevelCommentAuthorInfo.displayName}</span>
                    </Link>
                    {topLevelCommentAuthorInfo.isIdentity && <Badge variant="outline" className="text-xs px-1 py-0"><Award className="h-2.5 w-2.5 mr-0.5"/>Id</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(topLevelComment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mb-1">
                  {processedTopLevelCommentContent.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
                </p>
                 <ReactionButton
                    reactions={topLevelComment.detailedReactions}
                    onReact={(reactionType) => handleReactToSpecificComment(topLevelComment.id, reactionType)}
                    currentUserId={currentUser?.id}
                    isSubmitting={isReactingToComment}
                    buttonSize="xs"
                    popoverSide="bottom"
                />
              </div>
            </div>
          </div>

          {directReplies.length > 0 ? (
            directReplies.map(reply => {
              const replyAuthorInfo = getAuthorDisplayInfo(reply.author);
              const processedReplyContent = parseMentions(reply.content);
              return (
                <div key={reply.id} className="py-3 border-b border-border/20 last:border-b-0">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Link href={`/profile/${replyAuthorInfo.username}`} passHref>
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={replyAuthorInfo.profilePictureUrl} alt={replyAuthorInfo.displayName} />
                        <AvatarFallback>{getInitials(replyAuthorInfo.displayName)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <Link href={`/profile/${replyAuthorInfo.username}`} passHref>
                            <span className="text-xs font-semibold hover:underline font-headline">{replyAuthorInfo.displayName}</span>
                            </Link>
                            {replyAuthorInfo.isIdentity && <Badge variant="outline" className="text-[10px] px-1 py-0"><Award className="h-2 w-2 mr-0.5"/>Id</Badge>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mb-1">
                        {processedReplyContent.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
                      </p>
                      <ReactionButton
                        reactions={reply.detailedReactions}
                        onReact={(reactionType) => handleReactToSpecificComment(reply.id, reactionType)}
                        currentUserId={currentUser?.id}
                        isSubmitting={isReactingToComment}
                        buttonSize="xs"
                        popoverSide="bottom"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No replies yet.</p>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-background shrink-0">
          <form onSubmit={handleReplySubmit} className="w-full space-y-2">
            <div className="flex items-start gap-2">
              <Avatar className="h-9 w-9 border mt-1 shrink-0">
                <AvatarImage src={currentUserInfo.profilePictureUrl} alt={currentUserInfo.displayName} />
                <AvatarFallback>{getInitials(currentUserInfo.displayName)}</AvatarFallback>
              </Avatar>
              <Textarea
                ref={replyInputRef}
                placeholder={`Reply to @${topLevelCommentAuthorInfo.displayName}...`}
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
                className="min-h-[60px] flex-1"
                maxLength={500}
                rows={2}
                disabled={isCommenting}
              />
              <div className="flex flex-col gap-1">
                 <EmojiPicker 
                    onEmojiSelect={handleEmojiSelectForReply} 
                    triggerButtonSize="icon"
                    triggerButtonVariant="ghost"
                    popoverSide="top"
                  />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isCommenting || !newReplyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
