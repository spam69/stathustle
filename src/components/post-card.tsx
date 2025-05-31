
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Repeat, Heart, Upload, MoreHorizontal, AlertCircle, Send } from "lucide-react";
import type { Post, Comment as CommentType, User } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  onCommentAdded: (postId: string, commentText: string) => void;
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


export default function PostCard({ post, onCommentAdded }: PostCardProps) {
  const { author, content, createdAt, mediaUrl, mediaType, teamSnapshot, reactions, shares, comments = [] } = post;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };
  
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleToggleComments = () => {
    setShowComments(prev => !prev);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) {
      toast({ title: "Error", description: "Comment cannot be empty and you must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    onCommentAdded(post.id, newCommentText.trim());
    setNewCommentText('');
    setIsSubmittingComment(false);
    toast({ title: "Success", description: "Your comment has been posted!" });
    if (!showComments) {
      setShowComments(true); // Open comments section if it was closed
    }
  };

  return (
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
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={handleToggleComments} aria-expanded={showComments}>
              <MessageCircle className="h-4 w-4 mr-1.5" /> {comments.length}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
              <Repeat className="h-4 w-4 mr-1.5" /> {shares}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
              <Heart className="h-4 w-4 mr-1.5" /> {reactions}
            </Button>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <Upload className="h-4 w-4 mr-1.5" /> Share
            </Button>
            {/* <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <AlertCircle className="h-4 w-4 mr-1.5" /> Report
            </Button> */}
          </div>
        </div>

        {showComments && (
          <div className="w-full mt-4 pt-4 border-t border-dashed">
            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-4">
                <Avatar className="h-9 w-9 border mt-1">
                  <AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.username} />
                  <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="min-h-[60px] mb-2"
                    maxLength={500}
                  />
                  <Button type="submit" size="sm" disabled={isSubmittingComment || !newCommentText.trim()}>
                    {isSubmittingComment ? "Posting..." : "Post Comment"} <Send className="ml-2 h-3 w-3"/>
                  </Button>
                </div>
              </form>
            )}
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.slice().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Link href={`/profile/${comment.author.username}`} passHref>
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={comment.author.profilePictureUrl} alt={comment.author.username} />
                        <AvatarFallback>{getInitials(comment.author.username)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-0.5">
                        <Link href={`/profile/${comment.author.username}`} passHref>
                           <span className="text-xs font-semibold hover:underline font-headline">{comment.author.username}</span>
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
