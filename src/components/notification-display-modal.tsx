"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/notification-context";
import { useFeed } from "@/contexts/feed-context";
import { useCommentsModal } from "@/contexts/comments-modal-context";
import { useAuth } from "@/contexts/auth-context";
import type { Post, User, Identity, Comment } from "@/types";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, UserCheck, ArrowRight } from "lucide-react";
import UserProfileCard from './user-profile-card'; // For displaying follower info
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import PostCard from './post-card';

const getActorDisplayName = (actor: User | Identity) => {
  if (!actor) return 'Someone';
  return actor.isIdentity ? (actor as Identity).displayName || actor.username : actor.username;
};

const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

export default function NotificationDisplayModal() {
  const { 
    isNotificationModalOpen, 
    closeNotificationModal, 
    activeNotification,
    markOneAsRead
  } = useNotifications();
  const { fetchSinglePost } = useFeed();
  const { openCommentsModal } = useCommentsModal();
  const { user: currentUser } = useAuth();

  const [postDetails, setPostDetails] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [errorPost, setErrorPost] = useState<string | null>(null);

  useEffect(() => {
    if (activeNotification && activeNotification.postId && isNotificationModalOpen) {
      setIsLoadingPost(true);
      setErrorPost(null);
      setPostDetails(null);
      fetchSinglePost(activeNotification.postId, true) // Update cache with fresh data for notifications
        .then(post => {
          if (post) {
            setPostDetails(post);
            
            // For comment/reply notifications, automatically open comments modal
            if (activeNotification.type === 'new_reply' || activeNotification.type === 'new_comment' || activeNotification.type === 'new_reaction_comment') {
              markOneAsRead(activeNotification.id);
              closeNotificationModal();
              if (currentUser) {
                openCommentsModal(post.id, currentUser, activeNotification.commentId || activeNotification.originalCommentId);
              }
            }
          } else {
            setErrorPost("The related post could not be found or has been deleted.");
          }
        })
        .catch(err => {
          console.error("Error fetching post for notification modal:", err);
          setErrorPost("Failed to load the post. Please try again later.");
        })
        .finally(() => {
          setIsLoadingPost(false);
        });
    } else if (!activeNotification?.postId) {
      setPostDetails(null);
      setErrorPost(null);
    }
  }, [activeNotification, isNotificationModalOpen, fetchSinglePost, markOneAsRead, closeNotificationModal, openCommentsModal, currentUser]);

  if (!isNotificationModalOpen || !activeNotification) {
    return null;
  }
  
  const handleClose = () => {
    markOneAsRead(activeNotification.id);
    closeNotificationModal();
    console.log('handleClose');
  };

  const handleViewPost = () => {
    if (postDetails && currentUser) {
      markOneAsRead(activeNotification.id);
      closeNotificationModal();
      openCommentsModal(postDetails.id, currentUser, activeNotification.commentId || activeNotification.originalCommentId);
    }
  };

  const renderContent = () => {
    if (activeNotification.type === 'new_follower') {
      const actor = activeNotification.actor;
      return (
        <div className="p-4 text-center">
            <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary shadow-md">
                <AvatarImage src={actor.profilePictureUrl} alt={getActorDisplayName(actor)} data-ai-hint="person avatar"/>
                <AvatarFallback className="text-2xl">{getInitials(getActorDisplayName(actor))}</AvatarFallback>
            </Avatar>
            <p className="text-lg font-medium mb-1" dangerouslySetInnerHTML={{ __html: activeNotification.message }} />
            <p className="text-sm text-muted-foreground mb-4">Check out their profile!</p>
            <Button asChild onClick={closeNotificationModal}>
                <Link href={activeNotification.link || `/profile/${actor.username}`}>
                    View Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      );
    }

    if (activeNotification.postId) {
      if (isLoadingPost) {
        return (
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-3" />
                <Skeleton className="h-32 w-full rounded-md" />
                 <Skeleton className="h-10 w-1/3 mt-2" />
            </div>
        );
      }
      if (errorPost) {
        return (
          <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold">Could not load content</p>
            <p className="text-muted-foreground">{errorPost}</p>
          </div>
        );
      }
      if (postDetails) {
        // For post reactions, show the post card directly.
        // For other types that fall through, they will show a button to open the comments modal.
        if (activeNotification.type === 'new_reaction_post') {
            return (
              <div className="p-1 md:p-2 max-h-[70vh] overflow-y-auto"> 
                <PostCard 
                  post={postDetails} 
                  isEmbedded={false}
                /> 
              </div>
            );
        }
        
        return (
          <div className="p-6 text-center">
            <p className="text-lg font-medium mb-2" dangerouslySetInnerHTML={{ __html: activeNotification.message }} />
            <p className="text-sm text-muted-foreground mb-4">
              Click below to view the conversation.
            </p>
            <Button onClick={handleViewPost} className="w-full">
              View Post & Comments <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
    
    return (
        <div className="p-6">
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: activeNotification.message }} />
            {activeNotification.link && (
                <Button asChild className="mt-4" onClick={closeNotificationModal}>
                    <Link href={activeNotification.link}>View Details</Link>
                </Button>
            )}
        </div>
    );
  };

  return (
    <Dialog open={isNotificationModalOpen} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="font-headline">Notification Details</DialogTitle>
          {activeNotification && (
             <DialogDescription className="text-xs text-muted-foreground italic"  dangerouslySetInnerHTML={{ __html: activeNotification.message }} />
          )}
        </DialogHeader>
        
        {renderContent()}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
