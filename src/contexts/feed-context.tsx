"use client";

import type { Post, User, Identity, BlogShareDetails } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface FeedContextType {
  posts: Post[];
  isPostsLoading: boolean;
  postsError: Error | null;
  hasMorePosts: boolean;
  loadMorePosts: () => void;
  isFetchingMore: boolean;
  publishPost: (postData: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string, blogShareDetails?: BlogShareDetails }) => void;
  isPublishingPost: boolean;
  addCommentToFeedPost: (commentData: { postId: string; text: string; parentId?: string, mediaUrl?: string; mediaType?: 'image' | 'gif' }) => Promise<CommentType>;
  isCommenting: boolean;
  
  // Create Post Modal
  isCreatePostModalOpen: boolean;
  openCreatePostModal: (options?: { postToShare?: Post, pendingBlogShare?: BlogShareDetails }) => void;
  closeCreatePostModal: () => void;
  postToShare: Post | null;
  pendingBlogShare: BlogShareDetails | null;
  isPreparingShare: boolean;

  // Reactions
  reactToPost: (data: { postId: string; reactionType: ReactionType | null }) => void;
  isReactingToPost: boolean;
  reactToComment: (data: { postId:string; commentId: string; reactionType: ReactionType | null; }) => void;
  isReactingToComment: boolean;

  fetchSinglePost: (postId: string, updateCache?: boolean) => Promise<Post | null>;
  findPostInFeed: (postId: string) => Post | undefined;
  updatePostInCache: (post: Post) => void;
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

const addCommentAPI = async (commentData: { postId: string; content: string; authorId: string; parentId?: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }): Promise<CommentType> => {
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
  const { postId, commentId, userId, reactionType } = data;
  const response = await fetch(`/api/posts/${postId}/comments/${commentId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, reactionType }),
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

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Removed token from here as it's not used directly in this context after JWT removal
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [pendingBlogShare, setPendingBlogShare] = useState<BlogShareDetails | null>(null);
  const [isPreparingShare, setIsPreparingShare] = useState(false); 

  const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPostsAPI,
    staleTime: 1000 * 60 * 1, 
  });

  const displayedPosts = posts.map(post => {
    if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
      const original = posts.find(p => p.id === post.sharedOriginalPostId);
      if (original) {
        return { ...post, sharedOriginalPost: original };
      }
    }
    return post;
  });

  const fetchSinglePost = useCallback(async (postId: string, updateCache?: boolean): Promise<Post | null> => {
    try {
      const cachedPosts = queryClient.getQueryData<Post[]>(['posts']);
      const cachedPost = cachedPosts?.find(p => p.id === postId);
      
      // If updateCache is true, always fetch fresh data
      if (!updateCache && cachedPost) {
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
        
        // Update cache if requested and post was found
        if (updateCache && post) {
          queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
            if (!oldData) return [post];
            const existingIndex = oldData.findIndex(p => p.id === postId);
            if (existingIndex >= 0) {
              // Update existing post
              const updatedData = [...oldData];
              updatedData[existingIndex] = post;
              return updatedData;
            } else {
              // Add new post to beginning
              return [post, ...oldData];
            }
          });
        }
      }
      return post;
    } catch (error) {
      console.error("Error fetching single post:", error);
      toast({ title: "Error", description: `Could not fetch post details for ${postId}.`, variant: "destructive"});
      return null;
    }
  }, [queryClient, toast]);

  const updatePostInCache = useCallback((post: Post) => {
    queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
      if (!oldData) return [post];
      const existingIndex = oldData.findIndex(p => p.id === post.id);
      if (existingIndex >= 0) {
        // Update existing post
        const updatedData = [...oldData];
        updatedData[existingIndex] = post;
        return updatedData;
      } else {
        // Add new post to beginning
        return [post, ...oldData];
      }
    });
  }, [queryClient]);

  const openCreatePostModal = useCallback(async (data?: { postToShare?: Post; blogToShare?: BlogShareDetails }) => {
    if (isPreparingShare && !data?.blogToShare) return; 

    if (data?.postToShare) {
      setIsPreparingShare(true);
      setPendingBlogShare(null);
      let currentPostToEvaluate = data.postToShare;
      try {
        while (currentPostToEvaluate.sharedOriginalPostId) {
          const originalPost = await fetchSinglePost(currentPostToEvaluate.sharedOriginalPostId, false); // Don't update cache for share preparation
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

  const publishPostMutation = useMutation<Post, Error, { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif'; sharedOriginalPostId?: string; blogShareDetails?: BlogShareDetails }>({
    mutationFn: (postData) => {
      if (!user) throw new Error("User not logged in");
      return createPostAPI({ ...postData, authorId: user.id });
    },
    onSuccess: () => {
      // No need to optimistically update here for now, as react-query will refetch and handle it.
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      closeCreatePostModal();
      toast({ title: "Success", description: "Your post has been published!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to publish post.", variant: "destructive" });
    }
  });

  const addCommentMutation = useMutation<CommentType, Error, { postId: string; text: string; parentId?: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }>({
    mutationFn: (commentData) => {
      if (!user) throw new Error("User not logged in");
      // API expects 'content', but context type uses 'text'. Let's adapt here.
      const apiPayload = { ...commentData, content: commentData.text, authorId: user.id };
      // delete (apiPayload as any).text; // Not strictly necessary but good practice
      return addCommentAPI(apiPayload);
    },
    onSuccess: (newComment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] }); 
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

  const reactToCommentMutation = useMutation<Post, Error, { postId: string; commentId: string; reactionType: ReactionType | null; }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToCommentAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPost.id ? updatedPost : post) || [];
      });
    },
    onError: (error) => {
      toast({ title: "Error reacting to comment", description: error.message, variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation<Post, Error, { postId: string }>({
    mutationFn: async ({ postId }) => {
      if (!user) throw new Error("User not logged in");
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: "Success", description: "Post deleted successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete post.", variant: "destructive" });
    }
  });

  const findPostInFeed = (postId: string): Post | undefined => {
    return displayedPosts.find(p => p.id === postId);
  };

  return (
    <FeedContext.Provider value={{
      posts: displayedPosts,
      isPostsLoading,
      postsError,
      hasMorePosts: false, // This will be added if pagination is implemented
      loadMorePosts: () => {}, // This will be added if pagination is implemented
      isFetchingMore: false, // This will be added if pagination is implemented
      isCreatePostModalOpen,
      openCreatePostModal,
      closeCreatePostModal,
      postToShare,
      pendingBlogShare,
      isPreparingShare, 
      
      publishPost: (data) => publishPostMutation.mutate(data),
      addCommentToFeedPost: addCommentMutation.mutateAsync,
      reactToPost: (data) => reactToPostMutation.mutate(data),
      isReactingToPost: reactToPostMutation.isPending,
      reactToComment: (data) => reactToCommentMutation.mutate(data),
      isReactingToComment: reactToCommentMutation.isPending,
      fetchSinglePost,
      findPostInFeed,
      updatePostInCache,
      isPublishingPost: publishPostMutation.isPending,
      isCommenting: addCommentMutation.isPending,
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
