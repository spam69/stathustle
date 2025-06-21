"use client";

import { useState, useEffect, Fragment, useRef } from 'react';
import type { Post, Comment as CommentType, User, Identity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, Award, ChevronDown, ChevronRight, Users, Smile, ImageIcon, Film, Loader2 } from 'lucide-react'; // Added ImageIcon, Film, Loader2
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button';
import { useFeed } from '@/contexts/feed-context';
import type { ReactionType } from '@/lib/reactions';
import React from 'react'; // Import React for Fragment
import { parseMentions } from '@/lib/text-processing'; // Import for parsing mentions
import EmojiPicker from './emoji-picker'; // Import EmojiPicker
import MentionTextarea from './mention-textarea';
import GiphyPickerModal from './giphy-picker-modal';
import type { IGif } from '@giphy/js-types';
import Image from 'next/image';

interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | Identity | null;
  highlightedCommentId?: string;
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

export default function CommentsModal({ post, isOpen, onClose, currentUser, highlightedCommentId }: CommentsModalProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
  const { toast } = useToast();
  const { 
    addCommentToFeedPost, 
    isCommenting, 
    reactToComment, 
    isReactingToComment
  } = useFeed();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [imageToUpload, setImageToUpload] = useState<{ file: File, localPreviewUrl: string } | null>(null);
  const [gifUrl, setGifUrl] = useState<string | undefined>(undefined);
  const [isGiphyModalOpen, setIsGiphyModalOpen] = useState(false);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // New state for managing expanded replies and pagination
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesCounts, setRepliesCounts] = useState<Record<string, number>>({});
  const highlightedReplyRef = useRef<HTMLDivElement>(null);
  const [newlyAddedCommentId, setNewlyAddedCommentId] = useState<string | null>(null);
  const newlyAddedReplyRef = useRef<HTMLDivElement>(null);
  const topLevelCommentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      setNewCommentText('');
      setReplyingTo(null);
      setExpandedReplies(new Set());
      setRepliesCounts({});
      
      // If there's a highlighted comment, find its parent and expand replies
      if (highlightedCommentId && post) {
        const highlightedComment = post.comments?.find(c => c.id === highlightedCommentId);
        if (highlightedComment && highlightedComment.parentId) {
          // This is a reply, expand the parent comment's replies
          const parentCommentId = highlightedComment.parentId;
          setExpandedReplies(new Set([parentCommentId]));
          
          // Find the position of the highlighted reply to determine how many replies to load
          const parentReplies = post.comments?.filter(c => c.parentId === parentCommentId) || [];
          const replyIndex = parentReplies.findIndex(c => c.id === highlightedCommentId);
          if (replyIndex >= 0) {
            // Load enough replies to show the highlighted one (5 per page)
            const repliesToLoad = Math.ceil((replyIndex + 1) / 5) * 5;
            setRepliesCounts({ [parentCommentId]: repliesToLoad });
          }
        }
      }
    } else {
        setNewlyAddedCommentId(null);
    }
    // By using post.id in the dependency array, we ensure this effect only re-runs
    // when the modal is opened for a new post, not every time the current post's
    // data is updated (e.g., when a new comment is added).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, highlightedCommentId, post?.id]);

  // Scroll to highlighted reply after modal opens and replies are expanded
  useEffect(() => {
    if (isOpen && highlightedCommentId && highlightedReplyRef.current) {
      // Wait for the modal to be fully rendered and replies to be expanded
      const timer = setTimeout(() => {
        highlightedReplyRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, highlightedCommentId, expandedReplies, repliesCounts]);

  // Scroll to newly added reply
  useEffect(() => {
    if (newlyAddedCommentId && newlyAddedReplyRef.current) {
        newlyAddedReplyRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        const timer = setTimeout(() => setNewlyAddedCommentId(null), 1000);
        return () => clearTimeout(timer);
    }
  }, [newlyAddedCommentId, post]); // Reruns when post data updates

  if (!post) return null;

  const uploadImageToR2Internal = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64DataUri = reader.result as string;
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64DataUri,
              fileName: file.name,
              fileType: file.type,
            }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Upload to R2 failed');
          }
          resolve(result.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(new Error('Failed to read file for upload.'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File Too Large', description: 'Image size cannot exceed 5MB.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToUpload({ file, localPreviewUrl: reader.result as string });
        setGifUrl(undefined);
        toast({ title: 'Image Selected', description: 'Image ready for posting.' });
      };
      reader.onerror = () => {
        toast({ title: 'Error Reading File', description: 'Could not read the selected image.', variant: 'destructive' });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  };

  const handleGifSelect = (gif: IGif) => {
    const selectedGifUrl = gif.images.downsized_medium?.url || gif.images.original.url;
    setGifUrl(selectedGifUrl);
    setImageToUpload(null);
    setIsGiphyModalOpen(false);
    toast({ title: 'GIF Added', description: 'GIF attached from GIPHY.' });
  };

  const removeMedia = () => {
    setImageToUpload(null);
    setGifUrl(undefined);
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newCommentText.trim() && !imageToUpload && !gifUrl) || !currentUser) {
      toast({ title: 'Error', description: 'Comment cannot be empty and you must be logged in.', variant: 'destructive' });
      return;
    }

    if (replyingTo) {
        const parentId = replyingTo.id;
        if (!expandedReplies.has(parentId)) {
            setExpandedReplies(prev => new Set(prev).add(parentId));
        }
        const currentRepliesCount = post.comments?.filter(c => c.parentId === parentId).length || 0;
        const newTotalReplies = currentRepliesCount + 1;
        setRepliesCounts(prev => ({ ...prev, [parentId]: newTotalReplies}));
    }

    let finalMediaUrl: string | undefined = gifUrl;
    let finalMediaType: 'image' | 'gif' | undefined = gifUrl ? 'gif' : undefined;
    if (imageToUpload) {
      setIsUploadingToR2(true);
      try {
        const r2Url = await uploadImageToR2Internal(imageToUpload.file);
        if (r2Url) {
          finalMediaUrl = r2Url;
          finalMediaType = 'image';
        } else {
          toast({ title: 'Upload Failed', description: 'Could not upload image to storage. Please try again.', variant: 'destructive' });
          setIsUploadingToR2(false);
          return;
        }
      } catch (error: any) {
        toast({ title: 'Upload Error', description: error.message || 'An unexpected error occurred during image upload.', variant: 'destructive' });
        setIsUploadingToR2(false);
        return;
      }
      setIsUploadingToR2(false);
    }
    try {
        const newComment = await addCommentToFeedPost({ postId: post.id, text: newCommentText.trim(), parentId: replyingTo?.id, mediaUrl: finalMediaUrl, mediaType: finalMediaType });
        setNewlyAddedCommentId(newComment.id);
        setNewCommentText('');
        setReplyingTo(null);
        setImageToUpload(null);
        setGifUrl(undefined);
    } catch (error) {
        console.error("Failed to post comment:", error);
        // Error toast is handled in the context
    }
  };

  const startReplyToTopLevelComment = (commentToReply: CommentType) => {
    setReplyingTo(commentToReply);
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

  const toggleReplies = (commentId: string) => {
    const isExpanding = !expandedReplies.has(commentId);
    
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    if (isExpanding) {
      const parentComment = post.comments?.find(c => c.id === commentId);
      if (parentComment) {
        startReplyToTopLevelComment(parentComment);
      }
      setTimeout(() => {
        topLevelCommentRefs.current[commentId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
      }, 150);
    } else {
      // If we are collapsing the replies, and we were replying to that parent comment, cancel the reply.
      if (replyingTo?.id === commentId) {
        cancelReply();
      }
    }
  };

  const loadMoreReplies = (commentId: string) => {
    setRepliesCounts(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 5) + 5
    }));
  };

  const handleEmojiSelectForComment = (emoji: string) => {
    setNewCommentText(prev => prev + emoji);
    commentInputRef.current?.focus();
  };

  const renderReply = (reply: CommentType, parentComment: CommentType) => {
    const replyAuthorInfo = getAuthorDisplayInfo(reply.author);
    const processedReplyContent = parseMentions(reply.content);
    const isHighlighted = reply.id === highlightedCommentId;

    return (
      <div 
        key={reply.id} 
        ref={reply.id === newlyAddedCommentId ? newlyAddedReplyRef : (isHighlighted ? highlightedReplyRef : null)}
        className={`py-2 ${isHighlighted ? 'bg-primary/5' : ''} relative`}
      >
        {/* Vertical line connecting to parent */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border/70" />
        
        <div className="flex items-start gap-2 sm:gap-3 pl-8">
          <Link href={`/profile/${replyAuthorInfo.username}`} passHref>
            <Avatar className="h-7 w-7 border">
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
            {reply.mediaUrl && (
              <div className="mt-2 max-w-xs">
                {reply.mediaType === 'image' ? (
                  <Image src={reply.mediaUrl} alt="Comment media" width={200} height={200} className="rounded border object-cover" />
                ) : reply.mediaType === 'gif' ? (
                  <Image src={reply.mediaUrl} alt="Comment GIF" width={200} height={200} className="rounded border object-contain" unoptimized />
                ) : null}
              </div>
            )}
            <ReactionButton
              reactions={reply.detailedReactions}
              onReact={(reactionType) => handleReactToCommentClick(reply.id, reactionType)}
              currentUserId={currentUser?.id}
              isSubmitting={isReactingToComment}
              buttonSize="xs"
              popoverSide="bottom"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTopLevelComment = (comment: CommentType) => {
    console.log('Rendering comment:', comment);
    const authorInfo = getAuthorDisplayInfo(comment.author);
    const directReplies = (post.comments || []).filter(reply => reply.parentId === comment.id);
    const repliesCount = directReplies.length;
    const processedCommentContent = parseMentions(comment.content);
    const isExpanded = expandedReplies.has(comment.id);
    const visibleRepliesCount = repliesCounts[comment.id] || 5;
    const visibleReplies = directReplies.slice(0, visibleRepliesCount);
    const hasMoreReplies = directReplies.length > visibleRepliesCount;

    return (
      <div 
        key={comment.id} 
        ref={el => { topLevelCommentRefs.current[comment.id] = el; }}
        className="py-3 border-b border-border/30 last:border-b-0"
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <Link href={`/profile/${authorInfo.username}`} passHref>
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={authorInfo.profilePictureUrl} alt={authorInfo.displayName} />
              <AvatarFallback>{getInitials(authorInfo.displayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Link href={`/profile/${authorInfo.username}`} passHref>
                  <span className="text-sm font-semibold hover:underline font-headline">{authorInfo.displayName}</span>
                </Link>
                {authorInfo.isIdentity && <Badge variant="outline" className="text-xs px-1 py-0"><Award className="h-2.5 w-2.5 mr-0.5"/>Id</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mb-1">
              {processedCommentContent.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
            </p>
            {comment.mediaUrl && (
              <div className="mt-2 max-w-xs">
                {comment.mediaType === 'image' ? (
                  <Image src={comment.mediaUrl} alt="Comment media" width={200} height={200} className="rounded border object-cover" />
                ) : comment.mediaType === 'gif' ? (
                  <Image src={comment.mediaUrl} alt="Comment GIF" width={200} height={200} className="rounded border object-contain" unoptimized />
                ) : null}
                {comment.mediaType === 'gif' && <p className="text-[10px] text-muted-foreground mt-0.5">via GIPHY</p>}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <ReactionButton
                reactions={comment.detailedReactions}
                onReact={(reactionType) => handleReactToCommentClick(comment.id, reactionType)}
                currentUserId={currentUser?.id}
                isSubmitting={isReactingToComment}
                buttonSize="xs"
                popoverSide="bottom"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => startReplyToTopLevelComment(comment)}
              >
                Reply
              </Button>
              {repliesCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {repliesCount} {repliesCount === 1 ? 'Reply' : 'Replies'}
                </Button>
              )}
            </div>
            
            {/* Inline replies section */}
            {isExpanded && repliesCount > 0 && (
              <div className="mt-3 space-y-1">
                {visibleReplies.map(reply => renderReply(reply, comment))}
                {hasMoreReplies && (
                  <div className="pl-8 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadMoreReplies(comment.id)}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Load More Replies
                    </Button>
                  </div>
                )}
              </div>
            )}
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
              {(imageToUpload?.localPreviewUrl || gifUrl) && (
                <div className="mb-2 border border-border rounded-md p-2 max-w-xs bg-card/50 relative">
                  <p className="text-xs text-muted-foreground mb-1">Attached {imageToUpload ? 'image' : 'GIF'}:</p>
                  <Image 
                    src={imageToUpload ? imageToUpload.localPreviewUrl : gifUrl!} 
                    alt="Selected media" 
                    width={200} 
                    height={gifUrl ? 120 : 150}
                    objectFit={gifUrl ? 'contain' : 'cover'}
                    className="rounded max-h-40 w-auto" 
                    data-ai-hint="uploaded media" 
                    unoptimized={!!imageToUpload}
                  />
                  {gifUrl && <p className="text-[10px] text-muted-foreground mt-0.5">via GIPHY</p>}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 text-destructive/70 hover:text-destructive" 
                    onClick={removeMedia} 
                    title="Remove media" 
                    disabled={isCommenting || isUploadingToR2}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Avatar className="h-9 w-9 border mt-1 shrink-0">
                  <AvatarImage src={currentUserInfo.profilePictureUrl} alt={currentUserInfo.displayName} />
                  <AvatarFallback>{getInitials(currentUserInfo.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col gap-1">
                  <MentionTextarea
                    ref={commentInputRef}
                    placeholder={replyingTo ? `Reply to @${getAuthorDisplayInfo(replyingTo.author).displayName}...` : "Write a comment..."}
                    value={newCommentText}
                    onChange={setNewCommentText}
                    className="min-h-[60px] flex-1"
                    maxLength={500}
                    disabled={isCommenting || isUploadingToR2}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-primary/10"
                      title="Add Image"
                      onClick={handleImageUploadClick}
                      disabled={isCommenting || isUploadingToR2}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-primary/10"
                      title="Add GIF"
                      onClick={() => setIsGiphyModalOpen(true)}
                      disabled={isCommenting || isUploadingToR2}
                    >
                      <Film className="h-5 w-5" />
                    </Button>
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelectForComment}
                      triggerButtonSize="icon"
                      triggerButtonVariant="ghost"
                      popoverSide="top"
                    />
                    <div className="flex-1" />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isCommenting || isUploadingToR2 || (!newCommentText.trim() && !imageToUpload && !gifUrl)}
                      className="font-headline rounded-full px-6"
                    >
                      {isUploadingToR2 ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : isCommenting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
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
      <GiphyPickerModal
        isOpen={isGiphyModalOpen}
        onClose={() => setIsGiphyModalOpen(false)}
        onGifSelect={handleGifSelect}
      />
    </Dialog>
  );
}
