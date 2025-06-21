"use client";
import type { ReactNode } from 'react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { FeedProvider } from '@/contexts/feed-context';
import CreatePostForm from '@/components/create-post-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/auth-context';
import { useFeed } from '@/contexts/feed-context';
import NotificationDisplayModal from '@/components/notification-display-modal';
import { Suspense } from 'react';
import type { BlogShareDetails } from '@/types';

function CreatePostModal() {
  const { 
    isCreatePostModalOpen, 
    closeCreatePostModal, 
    publishPost, 
    isPublishingPost,
    postToShare, 
    pendingBlogShare,
  } = useFeed();
  const { user } = useAuth();

  if (!user) return null;

  const handleModalPostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif", sharedOriginalPostId?: string, blogShareDetails?: BlogShareDetails}) => {
    publishPost(newPostData);
  };
  
  const handleModalClose = () => {
    closeCreatePostModal(); 
  };


  return (
    <Dialog open={isCreatePostModalOpen} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{postToShare ? "Share Post" : (pendingBlogShare ? "Share Blog" : "Create a new post")}</DialogTitle>
          <DialogDescription>
            {postToShare ? "Add your thoughts to this post or share it directly." : (pendingBlogShare ? "Add your thoughts to this blog post." : "Share your thoughts, analysis, or attach your fantasy team.")}
          </DialogDescription>
        </DialogHeader>
        <CreatePostForm 
            onPostCreated={handleModalPostCreated} 
            isSubmitting={isPublishingPost} 
            isModal={true}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FeedProvider>
      <SidebarProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Header /> 
          <div className="flex flex-1 pt-[var(--header-height)]">
            <Sidebar collapsible="icon" className="w-64 min-w-[16rem] max-w-[18rem]">
              <SidebarContent>
                <SidebarNav />
              </SidebarContent>
            </Sidebar>
            <div className="flex-1 flex">
              <SidebarInset className="w-full flex-1 overflow-y-auto h-[calc(100vh_-_var(--header-height))]">
                <Suspense fallback={<div className="p-4">Loading...</div>}>
                  {children}
                </Suspense>
              </SidebarInset>
            </div>
          </div>
          <CreatePostModal />
          <NotificationDisplayModal />
        </div>
      </SidebarProvider>
    </FeedProvider>
  );
}
