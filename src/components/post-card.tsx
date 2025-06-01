
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Repeat, Upload, MoreHorizontal, Award, Link2, Loader2, Heart } from "lucide-react";
import type { Post } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import CommentsModal from './comments-modal';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button'; // Using ReactionButton for "like"
import { useFeed } from '@/contexts/feed-context';
import { Skeleton } from './ui/skeleton'; 

interface PostCardProps {
  post: Post;
  isEmbedded?: boolean; 
}

const ClientSanitizedHtml = ({ htmlContent }: { htmlContent: string }) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSanitizedHtml(DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } }));
    } else {
      setSanitizedHtml(htmlContent.replace(/<script.*?>.*?<\/script>/gi, ''));
    }
  }, [htmlContent]);

  return <div className="text-foreground/90" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};


export default function PostCard({ post: initialPost, isEmbedded = false }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const {
    addCommentToFeedPost,
    reactToPost, // This is for general reactions via ReactionButton
    reactToComment,
    isReactingToPost, // Loading state for ReactionButton
    openCreatePostModal,
    fetchSinglePost,
    isPreparingShare,
  } = useFeed();

  const [currentPost, setCurrentPost] = useState<Post>(initialPost);
  const [isLoadingOriginalPost, setIsLoadingOriginalPost] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPost(initialPost);
  }, [initialPost]);

  const { author, content, createdAt, mediaUrl, mediaType, shares, repliesCount, detailedReactions, comments, sharedOriginalPostId } = currentPost;
  const postToDisplayAsShared = currentPost.sharedOriginalPost;

  const authorUsername = author.username;
  const authorDisplayName = 'isIdentity' in author && author.displayName ? author.displayName : author.username;
  const authorProfilePic = author.profilePictureUrl;
  const isIdentityAuthor = 'isIdentity'in author && author.isIdentity;

  const getInitials = (name: string = "") => name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleToggleCommentsModal = () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please login to view comments.", variant: "destructive" });
      return;
    }
    setIsCommentsModalOpen(prev => !prev);
  };

  const handleReactToPostMain = (reactionType: import("@/lib/reactions").ReactionType | null) => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please login to react.", variant: "destructive" });
      return;
    }
    reactToPost({ postId: currentPost.id, reactionType });
  };
  
  const handleInitiateShare = async () => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please login to share posts.", variant: "destructive"});
        return;
    }
    if (isPreparingShare) return; 
    await openCreatePostModal(currentPost);
  };

  const handleSharedPostClick = async () => {
    if (!sharedOriginalPostId) return;
    const originalPostElement = document.getElementById(`post-card-${sharedOriginalPostId}`);
    if (originalPostElement) {
      originalPostElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return; 
    }
    if (!postToDisplayAsShared || postToDisplayAsShared.id !== sharedOriginalPostId) { 
      setIsLoadingOriginalPost(true);
      const fetchedDirectOriginal = await fetchSinglePost(sharedOriginalPostId); 
      setIsLoadingOriginalPost(false);
      if (fetchedDirectOriginal) {
        setCurrentPost(prev => ({...prev, sharedOriginalPost: fetchedDirectOriginal}));
        setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      } else {
        toast({ title: "Error", description: "Could not load the original post.", variant: "destructive"});
      }
    } else {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderPostContent = (targetPost: Post, isMainPost: boolean) => {
    const postAuthorInfo = 'isIdentity' in targetPost.author && targetPost.author.displayName ? targetPost.author.displayName : targetPost.author.username;
    const postAuthorUsername = targetPost.author.username;
    const postAuthorProfilePic = targetPost.author.profilePictureUrl;
    const postIsIdentityAuthor = 'isIdentity' in targetPost.author && targetPost.author.isIdentity;
    const postTimeAgo = formatDistanceToNow(new Date(targetPost.createdAt), { addSuffix: true });

    return (
      <>
        <CardHeader className={`flex flex-row items-start gap-3 p-4 ${isEmbedded ? 'bg-card/70 p-3' : ''}`}>
          <Link href={`/profile/${postAuthorUsername}`} passHref>
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={postAuthorProfilePic} alt={postAuthorInfo} data-ai-hint="person avatar" />
              <AvatarFallback>{getInitials(postAuthorInfo)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="grid gap-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${postAuthorUsername}`} passHref>
                <CardTitle className="text-sm font-semibold hover:underline font-headline text-foreground">{postAuthorInfo}</CardTitle>
              </Link>
              {postIsIdentityAuthor && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-primary/50 text-primary/90"><Award className="h-2.5 w-2.5 mr-1"/>Id</Badge>
              )}
            </div>
            {!postIsIdentityAuthor && (
              <p className="text-xs text-muted-foreground">@{postAuthorUsername}</p>
            )}
            <p className="text-xs text-muted-foreground">{postTimeAgo}</p>
          </div>
          {isMainPost && !isEmbedded && (
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-primary">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className={`px-4 pb-3 pt-0 ${isEmbedded ? 'p-3 pt-0' : ''}`}>
          {targetPost.content && (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none mb-3">
              <ClientSanitizedHtml htmlContent={targetPost.content} />
            </div>
          )}
          {targetPost.mediaUrl && (
            <div className={`mt-2 aspect-video relative overflow-hidden rounded-lg border border-border ${isEmbedded ? 'max-h-56' : ''}`}>
              {targetPost.mediaType === 'image' ? (
                <Image src={targetPost.mediaUrl} alt="Post media" layout="fill" objectFit="cover" data-ai-hint="social media content" />
              ) : targetPost.mediaType === 'gif' ? (
                <Image src={targetPost.mediaUrl} alt="Post GIF" layout="fill" objectFit="contain" unoptimized data-ai-hint="animated social gif" />
              ) : null}
            </div>
          )}
        </CardContent>
      </>
    );
  };

  return (
    <>
      <Card ref={cardRef} id={`post-card-${currentPost.id}`} className={`mb-0.5 overflow-hidden shadow-none border-b border-border rounded-none bg-transparent hover:bg-card/30 transition-colors duration-200 ${isEmbedded ? 'shadow-none ml-0 border-none' : ''}`}>
        {renderPostContent(currentPost, true)}

        {sharedOriginalPostId && !isEmbedded && (
          <div 
            className="mt-0 mb-3 mx-4 p-0 border border-border/80 rounded-xl hover:border-primary/50 cursor-pointer transition-all overflow-hidden"
            onClick={handleSharedPostClick}
            role="button"
            tabIndex={0}
            aria-label="View original shared post"
          >
            {isLoadingOriginalPost ? (
              <div className="p-3 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : postToDisplayAsShared ? (
              <PostCard post={postToDisplayAsShared} isEmbedded={true} />
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                <Link2 className="inline h-4 w-4 mr-1" /> Original post could not be loaded. <span className="underline">Try again</span>.
              </div>
            )}
          </div>
        )}

        {!isEmbedded && (
          <CardFooter className="flex justify-around items-center p-2 pt-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary flex-1 justify-center" onClick={handleToggleCommentsModal}>
              <MessageCircle className="h-5 w-5 mr-1.5" /> <span className="text-xs">{repliesCount || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-green-500 flex-1 justify-center" 
              disabled={!currentUser || isPreparingShare} 
              onClick={handleInitiateShare}
            >
              {isPreparingShare ? <Loader2 className="h-5 w-5 mr-1.5 animate-spin" /> : <Repeat className="h-5 w-5 mr-1.5" />}
              <span className="text-xs">{shares || 0}</span>
            </Button>
            {/* ReactionButton for "Like" and other reactions */}
            <div className="flex-1 justify-center flex">
                <ReactionButton
                    reactions={detailedReactions}
                    onReact={handleReactToPostMain}
                    currentUserId={currentUser?.id}
                    isSubmitting={isReactingToPost}
                    buttonSize="sm" 
                    popoverSide="top"
                />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-blue-500 flex-1 justify-center" 
              disabled={!currentUser || isPreparingShare} 
              onClick={handleInitiateShare} // Also triggers share functionality for simplicity
            >
              {isPreparingShare && currentPost.id === postToDisplayAsShared?.id ? <Loader2 className="h-5 w-5 mr-1.5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </Button>
          </CardFooter>
        )}
      </Card>

      {!isEmbedded && isCommentsModalOpen && currentPost && currentUser && (
        <CommentsModal
          post={currentPost}
          isOpen={isCommentsModalOpen}
          onClose={handleToggleCommentsModal}
          onCommentSubmit={(postId, text, parentId) => addCommentToFeedPost({ postId, content: text, parentId })}
          onReactToComment={(postId, commentId, reactionType) => reactToComment({ postId, commentId, reactionType })}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
