
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Repeat, Upload, MoreHorizontal, Award, Link2, Loader2 } from "lucide-react";
import type { Post } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import CommentsModal from './comments-modal';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button';
import { useFeed } from '@/contexts/feed-context';
import { Skeleton } from './ui/skeleton'; // For shared post loading

interface PostCardProps {
  post: Post;
  isEmbedded?: boolean; // New prop to indicate if this card is an embedded shared post
}

const ClientSanitizedHtml = ({ htmlContent }: { htmlContent: string }) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSanitizedHtml(DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } }));
    } else {
      // Basic stripping for server-side or non-DOM environments (less robust)
      setSanitizedHtml(htmlContent.replace(/<script.*?>.*?<\/script>/gi, ''));
    }
  }, [htmlContent]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};


export default function PostCard({ post: initialPost, isEmbedded = false }: PostCardProps) {
  const { author: initialAuthor, content: initialContent, createdAt: initialCreatedAt, mediaUrl: initialMediaUrl, mediaType: initialMediaType, teamSnapshot, shares: initialShares, sharedOriginalPostId, sharedOriginalPost: initialSharedOriginalPost } = initialPost;
  
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const {
    addCommentToFeedPost,
    reactToPost,
    reactToComment,
    isReactingToPost,
    isReactingToComment,
    openCreatePostModal,
    fetchSinglePost,
    isPreparingShare, // Get loading state for preparing share
  } = useFeed();

  const [currentPost, setCurrentPost] = useState<Post>(initialPost);
  const [isLoadingOriginalPost, setIsLoadingOriginalPost] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setCurrentPost(initialPost);
  }, [initialPost]);


  const { author, content, createdAt, mediaUrl, mediaType, shares, repliesCount, detailedReactions, comments } = currentPost;
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

  const handleReactToPost = (reactionType: import("@/lib/reactions").ReactionType | null) => {
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
    if (isPreparingShare) return; // Prevent multiple clicks while preparing
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
      // fetchSinglePost in the context is now designed to return the ultimate original if it's a chain.
      // However, for display purposes here, we are fetching the *direct* original of *this currentPost*.
      // If currentPost is C (shares B), and B (shares A), this fetches B.
      // The actual sharing action (handleInitiateShare -> openCreatePostModal) will resolve to A.
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
        <CardHeader className={`flex flex-row items-start gap-3 p-3 ${isEmbedded ? 'bg-muted/10' : ''}`}>
          <Link href={`/profile/${postAuthorUsername}`} passHref>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={postAuthorProfilePic} alt={postAuthorInfo} data-ai-hint="person avatar" />
              <AvatarFallback>{getInitials(postAuthorInfo)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="grid gap-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${postAuthorUsername}`} passHref>
                <CardTitle className="text-sm font-semibold hover:underline font-headline">{postAuthorInfo}</CardTitle>
              </Link>
              {postIsIdentityAuthor && (
                <Badge variant="outline" className="text-xs px-1 py-0.5"><Award className="h-2.5 w-2.5 mr-1"/>Id</Badge>
              )}
            </div>
            {!postIsIdentityAuthor && (
              <p className="text-xs text-muted-foreground">@{postAuthorUsername}</p>
            )}
            <p className="text-xs text-muted-foreground">{postTimeAgo}</p>
          </div>
          {isMainPost && !isEmbedded && (
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className={`p-3 pt-0 ${isEmbedded ? 'pb-1' : ''}`}>
          {targetPost.content && (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none mb-2">
              <ClientSanitizedHtml htmlContent={targetPost.content} />
            </div>
          )}
          {targetPost.mediaUrl && (
            <div className={`mt-2 aspect-video relative overflow-hidden rounded-md border ${isEmbedded ? 'max-h-48' : ''}`}>
              {targetPost.mediaType === 'image' ? (
                <Image src={targetPost.mediaUrl} alt="Post media" layout="fill" objectFit="cover" data-ai-hint="social media" />
              ) : targetPost.mediaType === 'gif' ? (
                <Image src={targetPost.mediaUrl} alt="Post GIF" layout="fill" objectFit="contain" unoptimized data-ai-hint="animated gif" />
              ) : null}
            </div>
          )}
          {targetPost.teamSnapshot && (
            <div className="mt-2 p-2 border rounded-lg bg-muted/40 text-xs">
              <h4 className="text-xs font-semibold text-muted-foreground mb-0.5 font-headline">Fantasy Team Snapshot:</h4>
              <p>Team: {targetPost.teamSnapshot.teamName}</p>
            </div>
          )}
        </CardContent>
      </>
    );
  };


  return (
    <>
      <Card ref={cardRef} id={`post-card-${currentPost.id}`} className={`mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${isEmbedded ? 'shadow-md hover:shadow-lg ml-0' : ''}`}>
        {renderPostContent(currentPost, true)}

        {sharedOriginalPostId && !isEmbedded && (
          <div 
            className="mt-0 mb-2 mx-3 p-0 border border-border/50 rounded-lg hover:border-primary/50 cursor-pointer transition-all"
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
          <CardFooter className="flex flex-col items-start p-3 pt-1 border-t">
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-0.5 sm:gap-1 items-center">
                <ReactionButton
                  reactions={detailedReactions}
                  onReact={handleReactToPost}
                  currentUserId={currentUser?.id}
                  isSubmitting={isReactingToPost}
                  buttonSize="sm"
                />
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={handleToggleCommentsModal}>
                  <MessageCircle className="h-4 w-4 mr-1.5" /> {repliesCount || 0}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-green-500" 
                  disabled={!currentUser || isPreparingShare} 
                  onClick={handleInitiateShare}
                >
                  {isPreparingShare ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Repeat className="h-4 w-4 mr-1.5" />}
                  {shares}
                </Button>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary" 
                  disabled={!currentUser || isPreparingShare} 
                  onClick={handleInitiateShare}
                >
                  {isPreparingShare ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />} 
                  Share
                </Button>
              </div>
            </div>
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

    