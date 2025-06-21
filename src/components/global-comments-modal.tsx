"use client";

import { useCommentsModal } from '@/contexts/comments-modal-context';
import { useFeed } from '@/contexts/feed-context';
import CommentsModal from './comments-modal';

export default function GlobalCommentsModal() {
  const { isCommentsModalOpen, currentPostId, currentUser, highlightedCommentId, closeCommentsModal } = useCommentsModal();
  const { findPostInFeed } = useFeed();

  if (!isCommentsModalOpen || !currentPostId || !currentUser) {
    return null;
  }

  const currentPost = findPostInFeed(currentPostId);

  if (!currentPost) {
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