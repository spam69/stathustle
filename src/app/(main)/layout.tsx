
"use client";
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import RightSidebar from '@/components/layout/right-sidebar'; 
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Loader2 } from 'lucide-react';
// LiveSupportChat import removed
import { FeedProvider } from '@/contexts/feed-context';
import CreatePostForm from '@/components/create-post-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/auth-context';
import { useFeed } from '@/contexts/feed-context';
import NotificationDisplayModal from '@/components/notification-display-modal';


function CreatePostModal() {
  const { 
    isCreatePostModalOpen, 
    closeCreatePostModal, 
    publishPost, 
    isPublishingPost,
    postToShare, 
  } = useFeed();
  const { user } = useAuth();

  if (!user) return null;

  const handleModalPostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif", sharedOriginalPostId?: string}) => {
    publishPost(newPostData);
  };
  
  const handleModalClose = () => {
    closeCreatePostModal(); 
  };


  return (
    <Dialog open={isCreatePostModalOpen} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{postToShare ? "Share Post" : "Create a new post"}</DialogTitle>
          <DialogDescription>
            {postToShare ? "Add your thoughts to this post or share it directly." : "Share your thoughts, analysis, or attach your fantasy team."}
          </DialogDescription>
        </DialogHeader>
        <CreatePostForm 
            onPostCreated={handleModalPostCreated} 
            isSubmitting={isPublishingPost} 
            isModal={true}
            postToShare={postToShare} 
            onCancelShare={handleModalClose} 
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
  // isChatOpen and toggleChat state and function removed

  return (
    <FeedProvider>
      <SidebarProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Header /> {/* toggleChat prop removed */}
          <div className="flex flex-1 pt-16"> {/* pt-16 to offset fixed header */}
            <Sidebar collapsible="icon"> {/* Left Sidebar */}
              <SidebarContent>
                <SidebarNav />
              </SidebarContent>
            </Sidebar>
            
            <SidebarInset> {/* Main Content Area */}
              <main className="flex-1 p-0 md:p-0 lg:p-0 overflow-y-auto h-[calc(100vh_-_4rem)]"> {/* Removed padding, handled by child or page */}
                {children}
              </main>
            </SidebarInset>

            {/* Right Sidebar - shown on larger screens */}
            <div className="hidden lg:block h-[calc(100vh_-_4rem)] sticky top-16">
              <RightSidebar />
            </div>
          </div>

          {/* Live Support Chat Toggle Button removed */}
          {/* LiveSupportChat component rendering removed */}
          <CreatePostModal />
          <NotificationDisplayModal />
        </div>
      </SidebarProvider>
    </FeedProvider>
  );
}
