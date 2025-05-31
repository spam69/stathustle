
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Repeat, Heart, Upload, MoreHorizontal } from "lucide-react";
import type { Post, Comment as CommentType, User } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import CommentsModal from './comments-modal'; // Import the modal

interface PostCardProps {
  post: Post;
  onCommentAdded: (postId: string, commentText: string, parentId?: string) => void;
  onLikeComment: (postId: string, commentId: string) => void; // For liking comments
  onLikePost: (postId: string) => void; // For liking the post itself
}

// Helper function to sanitize HTML on the client-side
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


export default function PostCard({ post, onCommentAdded, onLikeComment, onLikePost }: PostCardProps) {
  const { author, content, createdAt, mediaUrl, mediaType, teamSnapshot, reactions, shares, comments = [] } = post;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };
  
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleToggleCommentsModal = () => {
    setIsCommentsModalOpen(prev => !prev);
  };
  
  // Mock function for liking a post - replace with actual API call
  const handleLikePost = () => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please login to like posts.", variant: "destructive"});
        return;
    }
    onLikePost(post.id);
    // Optimistic update or re-fetch post data
    toast({ title: "Post Liked!", description: `You liked ${author.username}'s post.`});
  };


  return (
    <>
      <Card className="mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-start gap-4 p-4">
          <Link href={`/profile/${author.username}`} passHref>
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={author.profilePictureUrl} alt={author.username} data-ai-hint="person avatar" />
              <AvatarFallback>{getInitials(author.username)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="grid gap-0.5">
            <Link href={`/profile/${author.username}`} passHref>
              <CardTitle className="text-base font-semibold hover:underline font-headline">{author.username}</CardTitle>
            </Link>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <MoreHorizontal className="h-5 w-5" />
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
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={handleToggleCommentsModal}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> {post.repliesCount || 0} 
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                <Repeat className="h-4 w-4 mr-1.5" /> {shares}
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500" onClick={handleLikePost}>
                <Heart className="h-4 w-4 mr-1.5" /> {reactions}
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <Upload className="h-4 w-4 mr-1.5" /> Share
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {isCommentsModalOpen && post && (
        <CommentsModal
          post={post}
          isOpen={isCommentsModalOpen}
          onClose={handleToggleCommentsModal}
          onCommentSubmit={onCommentAdded}
          onLikeComment={onLikeComment}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
