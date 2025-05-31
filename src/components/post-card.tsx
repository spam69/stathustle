
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Repeat, Upload, MoreHorizontal, Award } from "lucide-react";
import type { Post, User, Identity } from "@/types"; // Removed CommentType as it's not directly used here
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import CommentsModal from './comments-modal'; 
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button'; // Import ReactionButton
import { useFeed } from '@/contexts/feed-context'; // Import useFeed

interface PostCardProps {
  post: Post;
  // onCommentAdded, onLikeComment, onLikePost are now handled by useFeed context
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

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};


export default function PostCard({ post }: PostCardProps) {
  const { author, content, createdAt, mediaUrl, mediaType, teamSnapshot, shares } = post;
  const { user: currentUser } = useAuth();
  const { toast } = useToast(); // Kept for other potential uses
  const { 
    addCommentToFeedPost, 
    reactToPost, 
    reactToComment, 
    isReactingToPost,
    isReactingToComment // Added from useFeed
  } = useFeed();
  
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const authorUsername = author.username;
  const authorDisplayName = 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const authorProfilePic = author.profilePictureUrl;
  const isIdentityAuthor = 'isIdentity' in author && (author as Identity).isIdentity;

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };
  
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleToggleCommentsModal = () => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please login to view comments.", variant: "destructive"});
        return;
    }
    setIsCommentsModalOpen(prev => !prev);
  };
  
  const handleReactToPost = (reactionType: import("@/lib/reactions").ReactionType | null) => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please login to react.", variant: "destructive"});
        return;
    }
    reactToPost({ postId: post.id, reactionType });
  };

  return (
    <>
      <Card className="mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-start gap-4 p-4">
          <Link href={`/profile/${authorUsername}`} passHref>
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={authorProfilePic} alt={authorDisplayName} data-ai-hint="person avatar" />
              <AvatarFallback>{getInitials(authorDisplayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="grid gap-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${authorUsername}`} passHref>
                <CardTitle className="text-base font-semibold hover:underline font-headline">{authorDisplayName}</CardTitle>
              </Link>
              {isIdentityAuthor && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5"><Award className="h-3 w-3 mr-1"/>Identity</Badge>
              )}
            </div>
             {!isIdentityAuthor && (
                <p className="text-xs text-muted-foreground">@{authorUsername}</p>
             )}
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">More options</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
            <ClientSanitizedHtml htmlContent={content} />
          </div>
          {mediaUrl && (
            <div className="mt-3 aspect-video relative overflow-hidden rounded-lg border">
              {mediaType === 'image' ? (
                <Image src={mediaUrl} alt="Post media" layout="fill" objectFit="cover" data-ai-hint="social media" />
              ) : mediaType === 'gif' ? (
                <Image src={mediaUrl} alt="Post GIF" layout="fill" objectFit="contain" unoptimized data-ai-hint="animated gif" />
              ) : null}
            </div>
          )}
          {teamSnapshot && (
            <div className="mt-3 p-3 border rounded-lg bg-muted/50">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1 font-headline">Fantasy Team Snapshot:</h4>
              <p className="text-sm">Team: {teamSnapshot.teamName}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start p-4 pt-2 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-1 items-center"> {/* items-center to align ReactionButton with others */}
              <ReactionButton
                reactions={post.detailedReactions}
                onReact={handleReactToPost}
                currentUserId={currentUser?.id}
                isSubmitting={isReactingToPost}
                buttonSize="sm"
              />
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={handleToggleCommentsModal}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> {post.repliesCount || 0} 
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500" disabled={!currentUser}>
                <Repeat className="h-4 w-4 mr-1.5" /> {shares}
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" disabled={!currentUser}>
                <Upload className="h-4 w-4 mr-1.5" /> Share
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {isCommentsModalOpen && post && currentUser && (
        <CommentsModal
          post={post}
          isOpen={isCommentsModalOpen}
          onClose={handleToggleCommentsModal}
          // onCommentSubmit and onLikeComment are now handled by useFeed context directly in CommentsModal
          // so we don't need to pass them here if CommentsModal uses useFeed.
          // However, CommentsModal structure was using props, so keeping structure consistent for now.
          onCommentSubmit={(postId, text, parentId) => addCommentToFeedPost({ postId, content: text, parentId })}
          onReactToComment={(postId, commentId, reactionType) => reactToComment({ postId, commentId, reactionType })}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
