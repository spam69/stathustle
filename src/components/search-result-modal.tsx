"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFeed } from "@/contexts/feed-context";
import type { Post } from "@/types";
import PostCard from "./post-card";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface SearchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
}

export default function SearchResultModal({ isOpen, onClose, postId }: SearchResultModalProps) {
  const { fetchSinglePost } = useFeed();

  const [postDetails, setPostDetails] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [errorPost, setErrorPost] = useState<string | null>(null);

  useEffect(() => {
    if (postId && isOpen) {
      setIsLoadingPost(true);
      setErrorPost(null);
      setPostDetails(null);
      fetchSinglePost(postId)
        .then(post => {
          if (post) {
            setPostDetails(post);
          } else {
            setErrorPost("The post could not be found or has been deleted.");
          }
        })
        .catch(err => {
          console.error("Error fetching post for search modal:", err);
          setErrorPost("Failed to load the post. Please try again later.");
        })
        .finally(() => {
          setIsLoadingPost(false);
        });
    } else if (!postId) {
      setPostDetails(null);
      setErrorPost(null);
    }
  }, [postId, isOpen, fetchSinglePost]);

  if (!isOpen || !postId) {
    return null;
  }

  const renderContent = () => {
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
      return (
        <div className="p-1 md:p-2 max-h-[70vh] overflow-y-auto">
          <PostCard post={postDetails} isEmbedded={false} />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="font-headline">Search Result</DialogTitle>
          <DialogDescription>
            Viewing post details
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 