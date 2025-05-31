
"use client";
import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LifeBuoy } from 'lucide-react';
import LiveSupportChat from '@/components/live-support-chat';
import { FeedProvider, useFeed } from '@/contexts/feed-context';
import CreatePostForm from '@/components/create-post-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/auth-context';

function CreatePostModal() {
  const { isCreatePostModalOpen, closeCreatePostModal, publishPost, isPublishingPost } = useFeed();
  const { user } = useAuth();

  if (!user) return null; 

  const handleModalPostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif"}) => {
    publishPost(newPostData); // publishPost from context now takes this object
    // Toast is handled within the mutation's onSuccess in FeedContext
  };

  return (
    <Dialog open={isCreatePostModalOpen} onOpenChange={(isOpen) => !isOpen && closeCreatePostModal()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new post</DialogTitle>
          <DialogDescription>
            Share your thoughts, analysis, or attach your fantasy team.
          </DialogDescription>
        </DialogHeader>
        <CreatePostForm onPostCreated={handleModalPostCreated} isSubmitting={isPublishingPost} />
      </DialogContent>
    </Dialog>
  );
}

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <FeedProvider> {/* FeedProvider now fetches its own initial data */}
      <SidebarProvider>
        <div className="flex min-h-screen flex-col">
          <Header toggleChat={toggleChat} />
          <div className="flex flex-1 pt-16"> 
            <Sidebar collapsible="icon">
              <SidebarContent>
                <SidebarNav />
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-[calc(100vh_-_4rem)]">
                {children}
              </main>
            </SidebarInset>
          </div>

          <Button
            variant="default"
            size="icon"
            className="fixed bottom-4 left-4 h-12 w-12 rounded-full shadow-lg z-40"
            onClick={toggleChat}
            aria-label="Toggle Live Support Chat"
          >
            <LifeBuoy className="h-6 w-6" />
          </Button>

          <LiveSupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          <CreatePostModal />
        </div>
      </SidebarProvider>
    </FeedProvider>
  );
}

    