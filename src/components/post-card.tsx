"use client";

import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageCircle, 
  Repeat, 
  MoreHorizontal, 
  Award, 
  Link2, 
  Loader2, 
  Newspaper, 
  ArrowRight,
  Edit,
  Trash2,
  AlertOctagon
} from "lucide-react";
import type { Post } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useCommentsModal } from '@/contexts/comments-modal-context';
import { Badge } from './ui/badge';
import ReactionButton from './reaction-button';
import { useFeed } from '@/contexts/feed-context';
import { Skeleton } from './ui/skeleton'; 
import ClientSanitizedHtml from './client-sanitized-html'; 
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type ReactionType, getReactionDefinition, REACTION_DEFINITIONS } from '@/lib/reactions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SearchResultModal from './search-result-modal';
import ReactionsModal from "./reactions-modal";
import EditPostModal from './edit-post-modal';


interface PostCardProps {
  post: Post;
  isEmbedded?: boolean;
  highlightedCommentId?: string;
}

interface ReactionSummaryDisplayItem {
  type: ReactionType;
  Icon: React.ElementType;
  count: number;
  colorClass: string;
}


export default function PostCard({ post: initialPost, isEmbedded = false, highlightedCommentId }: PostCardProps) {
  const { user: currentUser } = useAuth(); // Removed originalUser as activePrincipalId handles it
  const { toast } = useToast();
  const { openCommentsModal } = useCommentsModal();
  const {
    reactToPost, 
    openCreatePostModal,
    fetchSinglePost,
    isPreparingShare,
    isReactingToPost,
  } = useFeed();

  const [currentPost, setCurrentPost] = useState<Post>(initialPost);
  const [isLoadingOriginalPost, setIsLoadingOriginalPost] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSharedPostModalOpen, setIsSharedPostModalOpen] = useState(false);
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPost(initialPost);
  }, [initialPost]);

  // Auto-open comments modal when there's a highlighted comment
  useEffect(() => {
    if (highlightedCommentId && currentUser && !isEmbedded) {
      openCommentsModal(currentPost.id, currentUser, highlightedCommentId);
    }
  }, [highlightedCommentId, currentUser, isEmbedded, currentPost, openCommentsModal]);

  const { author, content, createdAt, mediaUrl, mediaType, shares, repliesCount, detailedReactions, sharedOriginalPostId, blogShareDetails } = currentPost;
  const postToDisplayAsShared = currentPost.sharedOriginalPost;

  const authorUsername = author.username;
  const authorDisplayName = 'isIdentity' in author && author.displayName ? author.displayName : author.username;
  const authorProfilePic = author.profilePictureUrl;
  const isIdentityAuthor = 'isIdentity'in author && author.isIdentity;

  const getInitials = (name: string = "") => name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  // Determine if the current authenticated principal is the author of the post
  const activePrincipalId = currentUser?.id;
  let isOwnPost = false;
  if (activePrincipalId && currentPost.author) {
      isOwnPost = activePrincipalId === currentPost.author.id;
  }

  const reactionCounts = useMemo(() => {
    if (!currentPost.detailedReactions || currentPost.detailedReactions.length === 0) {
      return {} as Record<ReactionType, number>;
    }
    const counts = REACTION_DEFINITIONS.reduce((acc, def) => {
      acc[def.type] = 0;
      return acc;
    }, {} as Record<ReactionType, number>);

    currentPost.detailedReactions.forEach(r => {
      if (counts[r.reactionType] !== undefined) {
        counts[r.reactionType]++;
      }
    });
    return counts;
  }, [currentPost.detailedReactions]);

  const topReactionsSummary: ReactionSummaryDisplayItem[] = useMemo(() => {
    return Object.entries(reactionCounts)
      .filter(([, count]) => count > 0)
      .sort(([, aCount], [, bCount]) => bCount - aCount)
      .slice(0, 3) 
      .map(([type, count]) => {
        const def = getReactionDefinition(type as ReactionType);
        return {
          type: type as ReactionType,
          Icon: def!.Icon,
          count,
          colorClass: def!.colorClass,
        };
      });
  }, [reactionCounts]);

  const totalReactionsCount = currentPost.detailedReactions?.length || 0;

  const pluralize = (count: number, singular: string, plural: string) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };

  const handleToggleCommentsModal = () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please login to view comments.", variant: "destructive" });
      return;
    }
    openCommentsModal(currentPost.id, currentUser, highlightedCommentId);
  };

  const handleReactToPostMain = (reactionType: ReactionType | null) => {
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
    await openCreatePostModal({ postToShare: currentPost });
  };

  const handleSharedPostClick = async () => {
    if (!sharedOriginalPostId) return;
    setIsSharedPostModalOpen(true);
  };

  const handleEditPost = () => {
    setIsEditModalOpen(true);
  };

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await axios.delete(`/api/posts/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Post deleted successfully!" });
      // Invalidate queries that fetch posts or feeds to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      // Ideally, you'd remove the post element from the DOM directly if possible
      // or use a state management solution to update the list without refetching everything.
    },
    onError: (error) => {
      console.error("Failed to delete post:", error);
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    },
  });

  const confirmDeletePost = async () => {
    deletePostMutation.mutate(currentPost.id);
    setIsDeleteDialogOpen(false);
  };

  const handleReportPost = () => {
    toast({ title: "Report Post", description: "Report functionality coming soon!" });
  };

  const renderPostContent = (targetPost: Post, isMainPostRender: boolean) => {
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
          {isMainPostRender && !isEmbedded && currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-primary">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwnPost ? (
                  <>
                    <DropdownMenuItem onClick={handleEditPost}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Post</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Post</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleReportPost}>
                    <AlertOctagon className="mr-2 h-4 w-4" />
                    <span>Report Post</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className={`px-4 pb-3 pt-0 ${isEmbedded ? 'p-3 pt-0' : ''}`}>
          {targetPost.content && (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none mb-3">
              <ClientSanitizedHtml htmlContent={targetPost.content} className="text-foreground/90" />
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
          {targetPost.mediaType === 'gif' && !isEmbedded && (
            <p className="text-[10px] text-muted-foreground mt-1 ml-1">via GIPHY</p>
          )}
        </CardContent>
      </>
    );
  };

  return (
    <>
      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <EditPostModal
          post={currentPost}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {/* Shared Post Modal */}
      {sharedOriginalPostId && isSharedPostModalOpen && (
        <SearchResultModal
          isOpen={isSharedPostModalOpen}
          onClose={() => setIsSharedPostModalOpen(false)}
          postId={sharedOriginalPostId}
        />
      )}
      {/* Reactions Modal */}
      <ReactionsModal
        isOpen={isReactionsModalOpen}
        onClose={() => setIsReactionsModalOpen(false)}
        reactions={currentPost.detailedReactions || []}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Card ref={cardRef} id={`post-card-${currentPost.id}`} className={`mb-0.5 overflow-hidden shadow-none border-b border-border rounded-none bg-transparent hover:bg-card/30 transition-colors duration-200 ${isEmbedded ? 'shadow-none ml-0 border-none' : ''}`}>
          {renderPostContent(currentPost, true)}

          {blogShareDetails && !isEmbedded && (
              <Card className="mt-0 mb-3 mx-4 p-0 border border-primary/30 bg-primary/5 rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-start gap-3 p-3">
                      {blogShareDetails.coverImageUrl ? (
                          <div className="w-20 h-auto aspect-[16/9] relative rounded-md overflow-hidden shrink-0">
                              <Image src={blogShareDetails.coverImageUrl} alt={blogShareDetails.title} layout="fill" objectFit="cover" data-ai-hint="blog cover preview"/>
                          </div>
                      ) : (
                          <Newspaper className="h-10 w-10 text-primary mt-1 shrink-0" />
                      )}
                      <div className="grid gap-0.5 flex-1">
                          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Blog Post</p>
                          <CardTitle className="text-base font-semibold hover:underline font-headline text-foreground">
                              <Link href={`/blogs/${blogShareDetails.authorUsername}/${blogShareDetails.url.split('/').pop()}`} target="_blank" rel="noopener noreferrer">
                                  {blogShareDetails.title}
                              </Link>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                              By <Link href={`/profile/${blogShareDetails.authorUsername}`} className="hover:underline">{blogShareDetails.authorDisplayName}</Link>
                          </p>
                      </div>
                  </CardHeader>
                  {blogShareDetails.excerpt && (
                      <CardContent className="p-3 pt-0">
                          <p className="text-sm leading-relaxed line-clamp-3 text-foreground/80">{blogShareDetails.excerpt}</p>
                      </CardContent>
                  )}
                  <CardFooter className="p-3 bg-primary/10">
                      <Button asChild variant="default" size="sm" className="w-full font-headline bg-primary hover:bg-primary/90">
                          <Link href={`/blogs/${blogShareDetails.authorUsername}/${blogShareDetails.url.split('/').pop()}`} target="_blank" rel="noopener noreferrer">
                              Read Blog <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                      </Button>
                  </CardFooter>
              </Card>
          )}


          {sharedOriginalPostId && !blogShareDetails && !isEmbedded && ( 
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
             <CardFooter className="flex flex-col p-0">
                <div className="flex justify-between items-center w-full px-4 py-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    {totalReactionsCount > 0 ? (
                      <>
                        <div className="flex items-center mr-1.5">
                          {topReactionsSummary.slice(0, 3).map(r => (
                            <r.Icon key={r.type} className={cn("h-3.5 w-3.5 -ml-1 first:ml-0", r.colorClass)} />
                          ))}
                        </div>
                        <span className="hover:underline cursor-pointer" onClick={() => setIsReactionsModalOpen(true)}>{totalReactionsCount}</span>
                      </>
                    ) : (
                       <span className="h-[14px]">0 Reacts</span> 
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="hover:underline cursor-pointer" onClick={handleToggleCommentsModal}>{pluralize(repliesCount, 'comment', 'comments')}</span>
                      <span className="hover:underline cursor-pointer">{pluralize(shares, 'share', 'shares')}</span>
                  </div>
                </div>

              {(totalReactionsCount > 0 || repliesCount > 0 || shares > 0) && (
                <Separator className="my-0 bg-border/50" />
              )}
              
              <div className="flex justify-around items-center p-1.5 pt-1 w-full">
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary flex-1 justify-center py-2 h-auto" onClick={handleToggleCommentsModal}>
                  <MessageCircle className="h-5 w-5 mr-1.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-green-500 flex-1 justify-center py-2 h-auto" 
                  disabled={!currentUser || isPreparingShare || !!blogShareDetails} 
                  onClick={handleInitiateShare}
                >
                  {isPreparingShare && currentPost.id === postToDisplayAsShared?.id ? <Loader2 className="h-5 w-5 mr-1.5 animate-spin" /> : <Repeat className="h-5 w-5 mr-1.5" />}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              and all its comments and reactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </>
  );
}

    
