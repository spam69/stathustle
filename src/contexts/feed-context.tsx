
"use client";

import type { Post, User, Comment as CommentType, Identity, BlogShareDetails } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ActiveCommentForReplies {
  post: Post;
  topLevelComment: CommentType;
}

interface FeedContextType {
  posts: Post[];
  isPostsLoading: boolean;
  postsError: Error | null;
  
  isCreatePostModalOpen: boolean;
  openCreatePostModal: (data?: { postToShare?: Post; blogToShare?: BlogShareDetails }) => Promise<void>;
  closeCreatePostModal: () => void;
  postToShare: Post | null; 
  pendingBlogShare: BlogShareDetails | null;
  isPreparingShare: boolean; 

  isCommentRepliesModalOpen: boolean;
  activeCommentForReplies: ActiveCommentForReplies | null;
  openCommentRepliesModal: (post: Post, comment: CommentType) => void;
  closeCommentRepliesModal: () => void;

  publishPost: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif'; sharedOriginalPostId?: string; blogShareDetails?: BlogShareDetails }) => void;
  addCommentToFeedPost: (data: { postId: string; content: string; parentId?: string }) => void;
  reactToPost: (data: { postId: string; reactionType: ReactionType | null }) => void;
  reactToComment: (data: { postId: string; commentId: string; reactionType: ReactionType | null }) => void;
  
  fetchSinglePost: (postId: string) => Promise<Post | null>; 

  isPublishingPost: boolean;
  isCommenting: boolean;
  isReactingToPost: boolean;
  isReactingToComment: boolean;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

const fetchPostsAPI = async (): Promise<Post[]> => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  const postsData: Post[] = await response.json();
  return postsData.map(post => {
    if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
      const original = postsData.find(p => p.id === post.sharedOriginalPostId);
      if (original) {
        return { ...post, sharedOriginalPost: original };
      }
    }
    return post;
  });
};

const createPostAPI = async (newPostData: { content: string; authorId: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string, blogShareDetails?: BlogShareDetails }): Promise<Post> => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // Token will be added by middleware or directly if needed
    body: JSON.stringify(newPostData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create post');
  }
  return response.json();
};

const addCommentAPI = async (commentData: { postId: string; content: string; authorId: string; parentId?: string }): Promise<CommentType> => {
  const { postId, ...payload } = commentData;
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // Token will be added by middleware or directly
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add comment');
  }
  return response.json();
};

const reactToPostAPI = async (data: { postId: string; reactionType: ReactionType | null; userId: string }): Promise<Post> => {
  const { postId, ...payload } = data;
  const response = await fetch(`/api/posts/${postId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to react to post');
  }
  return response.json();
};

const reactToCommentAPI = async (data: { postId: string; commentId: string; reactionType: ReactionType | null; userId: string }): Promise<Post> => {
  const { postId, commentId, ...payload } = data;
  const response = await fetch(`/api/posts/${postId}/comments/${commentId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
   if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to react to comment');
  }
  return response.json();
};

const fetchSinglePostAPI = async (postId: string): Promise<Post | null> => {
  const response = await fetch(`/api/posts/${postId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch post ${postId}`);
  }
  return response.json();
};

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const { user } = useAuth(); // Removed token from here as it's not used directly in this context after JWT removal
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [pendingBlogShare, setPendingBlogShare] = useState<BlogShareDetails | null>(null);
  const [isPreparingShare, setIsPreparingShare] = useState(false); 

  const [isCommentRepliesModalOpen, setIsCommentRepliesModalOpen] = useState(false);
  const [activeCommentForReplies, setActiveCommentForReplies] = useState<ActiveCommentForReplies | null>(null);

  const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPostsAPI,
    staleTime: 1000 * 60 * 1, 
  });

  const fetchSinglePost = useCallback(async (postId: string): Promise<Post | null> => {
    try {
      const cachedPosts = queryClient.getQueryData<Post[]>(['posts']);
      const cachedPost = cachedPosts?.find(p => p.id === postId);
      if (cachedPost) {
        let fullyPopulatedCachedPost = { ...cachedPost };
        if (fullyPopulatedCachedPost.sharedOriginalPostId && !fullyPopulatedCachedPost.sharedOriginalPost) {
            const originalFromCache = cachedPosts?.find(p => p.id === fullyPopulatedCachedPost.sharedOriginalPostId);
            if (originalFromCache) {
              fullyPopulatedCachedPost.sharedOriginalPost = { ...originalFromCache }; 
            }
        }
        return fullyPopulatedCachedPost;
      }
      
      const post = await fetchSinglePostAPI(postId);
      if (post) {
        if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
            const original = await fetchSinglePostAPI(post.sharedOriginalPostId);
            if (original) {
              post.sharedOriginalPost = original;
            }
        }
      }
      return post;
    } catch (error) {
      console.error("Error fetching single post:", error);
      toast({ title: "Error", description: `Could not fetch post details for ${postId}.`, variant: "destructive"});
      return null;
    }
  }, [queryClient, toast]);

  const openCreatePostModal = useCallback(async (data?: { postToShare?: Post; blogToShare?: BlogShareDetails }) => {
    if (isPreparingShare && !data?.blogToShare) return; 

    if (data?.postToShare) {
      setIsPreparingShare(true);
      setPendingBlogShare(null);
      let currentPostToEvaluate = data.postToShare;
      try {
        while (currentPostToEvaluate.sharedOriginalPostId) {
          const originalPost = await fetchSinglePost(currentPostToEvaluate.sharedOriginalPostId);
          if (originalPost) {
            currentPostToEvaluate = originalPost; 
          } else {
            toast({ title: "Warning", description: "Could not find the ultimate original post. Sharing the most recent available version.", variant: "default" });
            break;
          }
        }
        setPostToShare(currentPostToEvaluate);
      } catch (error: any) {
        console.error("Error preparing share:", error);
        toast({ title: "Error Preparing Share", description: error.message || "Could not prepare post for sharing.", variant: "destructive" });
        setPostToShare(data.postToShare); 
      } finally {
        setIsPreparingShare(false);
      }
    } else if (data?.blogToShare) {
      setPostToShare(null);
      setPendingBlogShare(data.blogToShare);
      setIsPreparingShare(false); 
    } else {
      setPostToShare(null);
      setPendingBlogShare(null);
    }
    setIsCreatePostModalOpen(true);
  }, [fetchSinglePost, toast, isPreparingShare]);

  const closeCreatePostModal = useCallback(() => {
    setIsCreatePostModalOpen(false);
    setPostToShare(null);
    setPendingBlogShare(null);
    setIsPreparingShare(false); 
  }, []);

  const openCommentRepliesModal = useCallback((post: Post, comment: CommentType) => {
    setActiveCommentForReplies({ post, topLevelComment: comment });
    setIsCommentRepliesModalOpen(true);
  }, []);

  const closeCommentRepliesModal = useCallback(() => {
    setIsCommentRepliesModalOpen(false);
    setActiveCommentForReplies(null);
  }, []);

  const publishPostMutation = useMutation<Post, Error, { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif'; sharedOriginalPostId?: string; blogShareDetails?: BlogShareDetails }>({
    mutationFn: (postData) => {
      if (!user) throw new Error("User not logged in");
      return createPostAPI({ ...postData, authorId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      closeCreatePostModal();
      toast({ title: "Success", description: "Your post has been published!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to publish post.", variant: "destructive" });
    }
  });

  const addCommentMutation = useMutation<CommentType, Error, { postId: string; content: string; parentId?: string }>({
    mutationFn: (commentData) => {
      if (!user) throw new Error("User not logged in");
      return addCommentAPI({ ...commentData, authorId: user.id });
    },
    onSuccess: (newComment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] }); 
      if (variables.parentId && activeCommentForReplies && variables.parentId === activeCommentForReplies.topLevelComment.id) {
        setActiveCommentForReplies(prev => {
          if (!prev) return null;
          const updatedTopLevelComment = { ...prev.topLevelComment };
          const updatedPost = {
            ...prev.post,
            comments: [...(prev.post.comments || []), newComment],
            repliesCount: (prev.post.repliesCount || 0) + 1,
          };
          return { post: updatedPost, topLevelComment: updatedTopLevelComment };
        });
      }
      toast({ title: "Success", description: variables.parentId ? "Reply posted!" : "Comment posted!"});
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to post comment.", variant: "destructive" });
    }
  });

  const reactToPostMutation = useMutation<Post, Error, { postId: string; reactionType: ReactionType | null }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToPostAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPost.id ? updatedPost : post) || [];
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to react to post.", variant: "destructive" });
    }
  });

  const reactToCommentMutation = useMutation<Post, Error, { postId: string; commentId: string; reactionType: ReactionType | null }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToCommentAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPostContainingComment) => {
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPostContainingComment.id ? updatedPostContainingComment : post) || [];
      });
      if(activeCommentForReplies && activeCommentForReplies.post.id === updatedPostContainingComment.id) {
        setActiveCommentForReplies(prev => {
          if(!prev) return null;
          const reactedCommentId = updatedPostContainingComment.comments?.find(c => 
            c.detailedReactions?.some(r => r.userId === user?.id) && 
            (c.id === activeCommentForReplies.topLevelComment.id || c.parentId === activeCommentForReplies.topLevelComment.id)
          )?.id;

          if (reactedCommentId === prev.topLevelComment.id) {
            const updatedTopLevel = updatedPostContainingComment.comments?.find(c => c.id === reactedCommentId);
            return updatedTopLevel ? { ...prev, topLevelComment: updatedTopLevel } : prev;
          } else {
             return { ...prev, post: updatedPostContainingComment };
          }
        });
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to react to comment.", variant: "destructive" });
    }
  });

  return (
    <FeedContext.Provider value={{
      posts,
      isPostsLoading,
      postsError,
      isCreatePostModalOpen,
      openCreatePostModal,
      closeCreatePostModal,
      postToShare,
      pendingBlogShare,
      isPreparingShare, 
      
      isCommentRepliesModalOpen,
      activeCommentForReplies,
      openCommentRepliesModal,
      closeCommentRepliesModal,

      publishPost: publishPostMutation.mutate,
      addCommentToFeedPost: addCommentMutation.mutate,
      reactToPost: reactToPostMutation.mutate,
      reactToComment: reactToCommentMutation.mutate,
      fetchSinglePost,
      isPublishingPost: publishPostMutation.isPending,
      isCommenting: addCommentMutation.isPending,
      isReactingToPost: reactToPostMutation.isPending,
      isReactingToComment: reactToCommentMutation.isPending,
    }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};
