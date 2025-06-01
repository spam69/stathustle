
"use client";

import { useEffect, useState }
from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/notification-context";
import { useFeed } from "@/contexts/feed-context";
import type { Post, User, Identity } from "@/types";
import PostCard from "./post-card";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, UserCheck, ArrowRight } from "lucide-react";
import UserProfileCard from './user-profile-card'; // For displaying follower info
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const getActorDisplayName = (actor: User | Identity) => {
  if (!actor) return 'Someone';
  return actor.isIdentity ? (actor as Identity).displayName || actor.username : actor.username;
};

const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';


export default function NotificationDisplayModal() {
  const { 
    isNotificationModalOpen, 
    closeNotificationModal, 
    activeNotification 
  } = useNotifications();
  const { fetchSinglePost } = useFeed(); // To fetch post details

  const [postDetails, setPostDetails] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [errorPost, setErrorPost] = useState<string | null>(null);

  useEffect(() => {
    if (activeNotification && activeNotification.postId && isNotificationModalOpen) {
      setIsLoadingPost(true);
      setErrorPost(null);
      setPostDetails(null); // Clear previous post details
      fetchSinglePost(activeNotification.postId)
        .then(post => {
          if (post) {
            setPostDetails(post);
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
      // If notification is not post-related (e.g., new follower), clear post details
      setPostDetails(null);
      setErrorPost(null);
    }
  }, [activeNotification, isNotificationModalOpen, fetchSinglePost]);

  if (!isNotificationModalOpen || !activeNotification) {
    return null;
  }
  
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
        // TODO: Implement highlighting for specific comment/reply
        // For now, just showing the PostCard
        // We might want a more stripped-down version of PostCard for modals or pass props to control its appearance/behavior
        return (
          <div className="p-1 md:p-2 max-h-[70vh] overflow-y-auto"> 
            <PostCard post={postDetails} isEmbedded={false} /> 
            {/* 
              Future enhancement for comments:
              If activeNotification.commentId or activeNotification.originalCommentId exists,
              we would need to find this comment within postDetails.comments,
              assign it a ref, and scroll to it.
              Could also pass a highlightedCommentId prop to PostCard.
            */}
          </div>
        );
      }
    }
    
    // Fallback for other notification types or if no content is to be shown
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
    <Dialog open={isNotificationModalOpen} onOpenChange={(isOpen) => !isOpen && closeNotificationModal()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="font-headline">Notification Details</DialogTitle>
          {activeNotification && (
             <DialogDescription className="text-xs text-muted-foreground italic"  dangerouslySetInnerHTML={{ __html: activeNotification.message }} />
          )}
        </DialogHeader>
        
        {renderContent()}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={closeNotificationModal}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
