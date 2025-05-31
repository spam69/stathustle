
"use client";

import { useState, useEffect, Fragment } from 'react';
import type { Post, Comment as CommentType, User, Identity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, Award } from 'lucide-react'; // Removed Heart
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button'; // Import ReactionButton
import { useFeed } from '@/contexts/feed-context'; // Import useFeed
import type { ReactionType } from '@/lib/reactions';

interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentSubmit: (postId: string, text: string, parentId?: string) => void; // Keep for structure consistency
  onReactToComment: (postId: string, commentId: string, reactionType: ReactionType | null) => void; // Keep for structure consistency
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

export default function CommentsModal({ post, isOpen, onClose, onCommentSubmit, onReactToComment, currentUser }: CommentsModalProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ topLevelCommentId: string; displayUsername: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();
  const { isReactingToComment } = useFeed(); // Get reaction loading state

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
    setIsSubmittingComment(true);
    // Simulating API call delay, in real app onCommentSubmit might be async
    await new Promise(resolve => setTimeout(resolve, 300)); 
    onCommentSubmit(post.id, newCommentText.trim(), replyingTo?.topLevelCommentId);
    setNewCommentText('');
    setReplyingTo(null);
    setIsSubmittingComment(false);
    toast({ title: "Success", description: replyingTo ? "Reply posted!" : "Comment posted!"});
  };

  const startReply = (topLevelId: string, usernameToReplyTo: string) => {
    setReplyingTo({ topLevelCommentId: topLevelId, displayUsername: usernameToReplyTo });
    // Focus textarea can be added here
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
    onReactToComment(post.id, commentId, reactionType);
  };

  const renderCommentAndReplies = (comment: CommentType, allComments: CommentType[], originalCommentId: string, depth = 0) => {
    const replies = allComments.filter(c => c.parentId === comment.id)
                               .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const authorInfo = getAuthorDisplayInfo(comment.author);

    return (
      <div key={comment.id} className={`py-3 ${depth > 0 ? 'ml-6 pl-4 border-l border-muted/50' : ''}`}>
        <div className="flex items-start gap-3">
          <Link href={`/profile/${authorInfo.username}`} passHref>
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={authorInfo.profilePictureUrl} alt={authorInfo.displayName} />
              <AvatarFallback>{getInitials(authorInfo.displayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${authorInfo.username}`} passHref>
                  <span className="text-xs font-semibold hover:underline font-headline">{authorInfo.displayName}</span>
                </Link>
                {authorInfo.isIdentity && <Badge variant="outline" className="text-xs px-1 py-0"><Award className="h-2.5 w-2.5 mr-0.5"/>Id</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mb-1">{comment.content}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ReactionButton
                reactions={comment.detailedReactions}
                onReact={(reactionType) => handleReactToCommentClick(comment.id, reactionType)}
                currentUserId={currentUser?.id}
                isSubmitting={isReactingToComment} // Use global feed context loading state
                buttonSize="xs"
                popoverSide="bottom"
              />
              <Button variant="ghost" size="xs" className="p-1 h-auto text-muted-foreground" onClick={() => startReply(originalCommentId, authorInfo.displayName)} disabled={!currentUser}>
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="ml-1">Reply</span>
              </Button>
            </div>
          </div>
        </div>
        {replies.map(reply => renderCommentAndReplies(reply, allComments, originalCommentId, depth + 1))}
      </div>
    );
  };
  
  const topLevelComments = (post.comments || [])
    .filter(comment => !comment.parentId) 
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  const currentUserInfo = currentUser ? getAuthorDisplayInfo(currentUser) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-headline">Comments on {getAuthorDisplayInfo(post.author).displayName}'s post</DialogTitle>
          {/* <DialogDescription> is not used here to save space </DialogDescription> */}
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-4">
            {topLevelComments.length > 0 ? (
              topLevelComments.map(comment => renderCommentAndReplies(comment, post.comments || [], comment.id))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
            )}
        </ScrollArea>

        {currentUserInfo ? (
          <DialogFooter className="p-4 border-t bg-background sticky bottom-0">
            <form onSubmit={handleMainSubmit} className="w-full space-y-2">
              {replyingTo && (
                <div className="text-xs text-muted-foreground flex justify-between items-center">
                  <span>Replying to <span className="font-semibold">@{replyingTo.displayUsername}</span></span>
                  <Button variant="ghost" size="xs" onClick={cancelReply} type="button" className="p-1 h-auto text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3 mr-1"/> Cancel
                  </Button>
                </div>
              )}
              <div className="flex items-start gap-2">
                 <Avatar className="h-9 w-9 border mt-1">
                  <AvatarImage src={currentUserInfo.profilePictureUrl} alt={currentUserInfo.displayName} />
                  <AvatarFallback>{getInitials(currentUserInfo.displayName)}</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder={replyingTo ? `Reply to @${replyingTo.displayUsername}...` : "Write a comment..."}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="min-h-[60px] flex-1"
                  maxLength={500}
                  rows={2}
                />
                <Button type="submit" size="icon" className="h-10 w-10" disabled={isSubmittingComment || !newCommentText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </DialogFooter>
        ) : (
          <DialogFooter className="p-4 border-t">
             <p className="text-sm text-muted-foreground text-center w-full">
                Please <Link href="/login" className="underline text-primary">login</Link> to comment.
             </p>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Declaration merging was here for button size 'xs', removing as it's now in the main button file
// declare module '@/components/ui/button' {
//     interface ButtonProps {
//         size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
//     }
// }
