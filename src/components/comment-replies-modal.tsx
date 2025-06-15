"use client";

import { useState, useEffect, useRef } from 'react';
import type { Post, Comment as CommentType, User, Identity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Award, X, Smile, ImageIcon, Film } from 'lucide-react'; // Added ImageIcon and Film
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
import MentionTextarea from './mention-textarea';
import Image from 'next/image';
import GiphyPickerModal from './giphy-picker-modal';
import { Loader2 } from 'lucide-react';

const getAuthorDisplayInfo = (author: User | Identity) => {
  if (!author || typeof author !== 'object') {
    return { username: '', displayName: '', profilePictureUrl: '', isIdentity: false };
  }
  const username = author.username;
  const displayName = typeof author === 'object' && 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const profilePictureUrl = author.profilePictureUrl;
  const isIdentity = typeof author === 'object' && 'isIdentity' in author && (author as Identity).isIdentity;
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
  const [imageToUpload, setImageToUpload] = useState<{ file: File, localPreviewUrl: string } | null>(null);
  const [gifUrl, setGifUrl] = useState<string | undefined>(undefined);
  const [isGiphyModalOpen, setIsGiphyModalOpen] = useState(false);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommentRepliesModalOpen) {
      setNewReplyText('');
      setImageToUpload(null);
      setGifUrl(undefined);
    }
  }, [isCommentRepliesModalOpen]);

  if (!isCommentRepliesModalOpen || !activeCommentForReplies || !currentUser) {
    return null;
  }

  const { post, topLevelComment } = activeCommentForReplies;

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

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newReplyText.trim() && !imageToUpload && !gifUrl) || !currentUser) {
      toast({ title: 'Error', description: 'Reply cannot be empty and you must be logged in.', variant: 'destructive' });
      return;
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
    addCommentToFeedPost({
      postId: post.id,
      content: newReplyText.trim(),
      parentId: topLevelComment.id,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType
    });
    setNewReplyText('');
    setImageToUpload(null);
    setGifUrl(undefined);
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
                {topLevelComment.mediaUrl && (
                  <div className="mt-2 max-w-xs">
                    {topLevelComment.mediaType === 'image' ? (
                      <Image src={topLevelComment.mediaUrl} alt="Comment media" width={200} height={200} className="rounded border object-cover" />
                    ) : topLevelComment.mediaType === 'gif' ? (
                      <Image src={topLevelComment.mediaUrl} alt="Comment GIF" width={200} height={200} className="rounded border object-contain" unoptimized />
                    ) : null}
                    {topLevelComment.mediaType === 'gif' && <p className="text-[10px] text-muted-foreground mt-0.5">via GIPHY</p>}
                  </div>
                )}
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
                <div key={reply.id} className="py-3 border-b border-border/20 last:border-b-0 ml-8">
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
                  ref={replyInputRef}
                  placeholder={`Reply to @${topLevelCommentAuthorInfo.displayName}...`}
                  value={newReplyText}
                  onChange={setNewReplyText}
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
                    onEmojiSelect={handleEmojiSelectForReply}
                    triggerButtonSize="icon"
                    triggerButtonVariant="ghost"
                    popoverSide="top"
                  />
                  <div className="flex-1" />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCommenting || isUploadingToR2 || (!newReplyText.trim() && !imageToUpload && !gifUrl)}
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
                        Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogFooter>
      </DialogContent>
      <GiphyPickerModal
        isOpen={isGiphyModalOpen}
        onClose={() => setIsGiphyModalOpen(false)}
        onGifSelect={handleGifSelect}
      />
    </Dialog>
  );
}
