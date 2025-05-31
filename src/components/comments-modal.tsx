
"use client";

import { useState, useEffect, Fragment } from 'react';
import type { Post, Comment as CommentType, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageSquare, Send, CornerDownRight, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentSubmit: (postId: string, text: string, parentId?: string) => void;
  onLikeComment: (postId: string, commentId: string) => void;
  currentUser: User | null;
}

const getInitials = (name: string = "") => {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
};

export default function CommentsModal({ post, isOpen, onClose, onCommentSubmit, onLikeComment, currentUser }: CommentsModalProps) {
  const [newCommentText, setNewCommentText] = useState('');
  // replyingTo will store the ID of the top-level comment and the username of the direct comment being replied to
  const [replyingTo, setReplyingTo] = useState<{ topLevelCommentId: string; displayUsername: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    // If replyingTo is set, use its topLevelCommentId as the parentId. Otherwise, it's a new top-level comment.
    onCommentSubmit(post.id, newCommentText.trim(), replyingTo?.topLevelCommentId);
    setNewCommentText('');
    setReplyingTo(null);
    setIsSubmitting(false);
    toast({ title: "Success", description: replyingTo ? "Reply posted!" : "Comment posted!"});
  };

  // Start reply: topLevelId is the ID of the original comment. username is the author of the comment being directly replied to.
  const startReply = (topLevelId: string, username: string) => {
    setReplyingTo({ topLevelCommentId: topLevelId, displayUsername: username });
    // Focus the textarea - might need a ref
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewCommentText(''); // Optionally clear text when cancelling reply focus
  };

  // originalCommentId is the ID of the top-level comment in this thread
  const renderCommentAndReplies = (comment: CommentType, allComments: CommentType[], originalCommentId: string, depth = 0) => {
    const replies = allComments.filter(c => c.parentId === comment.id) // Direct replies to *this* comment
                               .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // For display purposes, we only visually nest direct replies.
    // However, when the user clicks "Reply" on any comment (top-level or reply),
    // the new comment will always be a child of `originalCommentId`.
    return (
      <div key={comment.id} className={`py-3 ${depth > 0 ? 'ml-6 pl-4 border-l border-muted/50' : ''}`}>
        <div className="flex items-start gap-3">
          <Link href={`/profile/${comment.author.username}`} passHref>
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={comment.author.profilePictureUrl} alt={comment.author.username} />
              <AvatarFallback>{getInitials(comment.author.username)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <Link href={`/profile/${comment.author.username}`} passHref>
                <span className="text-xs font-semibold hover:underline font-headline">{comment.author.username}</span>
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mb-1">{comment.content}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button variant="ghost" size="xs" className="p-1 h-auto" onClick={() => onLikeComment(post.id, comment.id)} disabled={!currentUser}>
                <Heart className={`h-3.5 w-3.5 ${comment.likes && comment.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                <span className="ml-1">{comment.likes || 0}</span>
              </Button>
              <Button variant="ghost" size="xs" className="p-1 h-auto" onClick={() => startReply(originalCommentId, comment.author.username)} disabled={!currentUser}>
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="ml-1">Reply</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Recursively render replies to this comment, passing the originalCommentId */}
        {replies.map(reply => renderCommentAndReplies(reply, allComments, originalCommentId, depth + 1))}
      </div>
    );
  };
  
  const topLevelComments = (post.comments || [])
    .filter(comment => !comment.parentId) // Only comments without a parentId are top-level
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-headline">Comments on {post.author.username}'s post</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-4">
            {topLevelComments.length > 0 ? (
              // For each top-level comment, pass its own ID as the originalCommentId
              topLevelComments.map(comment => renderCommentAndReplies(comment, post.comments || [], comment.id))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
            )}
        </ScrollArea>

        {currentUser ? (
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
                  <AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.username} />
                  <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder={replyingTo ? `Reply to @${replyingTo.displayUsername}...` : "Write a comment..."}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="min-h-[60px] flex-1"
                  maxLength={500}
                  rows={2}
                />
                <Button type="submit" size="icon" className="h-10 w-10" disabled={isSubmitting || !newCommentText.trim()}>
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

// Add size="xs" to Button variant types if not already present, or use existing small size
// This is a conceptual type for button, actual props depend on your Button component
declare module '@/components/ui/button' {
    interface ButtonProps {
        size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
    }
}

