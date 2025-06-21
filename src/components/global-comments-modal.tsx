"use client";

import { useCommentsModal } from '@/contexts/comments-modal-context';
import { useFeed } from '@/contexts/feed-context';
import CommentsModal from './comments-modal';
import { useState, useEffect } from 'react';
import type { Post } from '@/types';

export default function GlobalCommentsModal() {
  const { isCommentsModalOpen, currentPostId, currentUser, highlightedCommentId, closeCommentsModal } = useCommentsModal();
  const { findPostInFeed, fetchSinglePost } = useFeed();
  const [freshPost, setFreshPost] = useState<Post | null>(null);
  const [isLoadingFreshPost, setIsLoadingFreshPost] = useState(false);

  // Fetch fresh post data when modal opens, especially for comment/reply notifications
  useEffect(() => {
    if (isCommentsModalOpen && currentPostId && currentUser) {
      // Check if this is a comment/reply notification (indicated by highlightedCommentId)
      const isCommentNotification = !!highlightedCommentId;
      
      if (isCommentNotification) {
        // For comment notifications, always fetch fresh data to get latest comments
        setIsLoadingFreshPost(true);
        fetchSinglePost(currentPostId, true) // Update cache with fresh data
          .then(post => {
            setFreshPost(post);
          })
          .catch(error => {
            console.error('Error fetching fresh post for comments modal:', error);
            // Fall back to cached post if fresh fetch fails
            setFreshPost(null);
          })
          .finally(() => {
            setIsLoadingFreshPost(false);
          });
      } else {
        // For other notifications, try cached first, then fetch fresh if not found
        const cachedPost = findPostInFeed(currentPostId);
        if (!cachedPost) {
          setIsLoadingFreshPost(true);
          fetchSinglePost(currentPostId, true) // Update cache with fresh data
            .then(post => {
              setFreshPost(post);
            })
            .catch(error => {
              console.error('Error fetching fresh post for comments modal:', error);
              setFreshPost(null);
            })
            .finally(() => {
              setIsLoadingFreshPost(false);
            });
        } else {
          setFreshPost(null); // Use cached post
        }
      }
    } else {
      // Reset state when modal closes
      setFreshPost(null);
      setIsLoadingFreshPost(false);
    }
  }, [isCommentsModalOpen, currentPostId, currentUser, highlightedCommentId, findPostInFeed, fetchSinglePost]);

  if (!isCommentsModalOpen || !currentPostId || !currentUser) {
    return null;
  }

  // Use fresh post if available, otherwise fall back to cached post
  const currentPost = freshPost || findPostInFeed(currentPostId);

  if (!currentPost) {
    if (isLoadingFreshPost) {
      // Show loading state while fetching fresh post
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            Loading comments...
          </div>
        </div>
      );
    }
    // Post might not be in the feed yet, or has been removed.
    // We could show a loading state or an error, but for now we'll just close the modal.
    // In a real-world scenario, you might want to fetch the post here.
    return null;
  }

  return (
    <CommentsModal
      post={currentPost}
      isOpen={isCommentsModalOpen}
      onClose={closeCommentsModal}
      currentUser={currentUser}
      highlightedCommentId={highlightedCommentId}
    />
  );
} 