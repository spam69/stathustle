"use client";
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Loader2 } from 'lucide-react';
import LiveSupportChat from '@/components/live-support-chat';
import { FeedProvider } from '@/contexts/feed-context';
import CreatePostForm from '@/components/create-post-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/auth-context';
import { useFeed } from '@/contexts/feed-context';


function CreatePostModal() {
  const { 
    isCreatePostModalOpen, 
    closeCreatePostModal, 
    publishPost, 
    isPublishingPost,
    postToShare, // Get the post to share from context
    // clearPostToShare (this will be handled by closeCreatePostModal or form success)
  } = useFeed();
  const { user } = useAuth();

  if (!user) return null;

  const handleModalPostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif", sharedOriginalPostId?: string}) => {
    publishPost(newPostData);
    // Modal closing and clearing postToShare is handled by publishPost success or closeCreatePostModal
  };
  
  const handleModalClose = () => {
    closeCreatePostModal(); // This will also clear postToShare via its implementation in FeedContext
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
            postToShare={postToShare} // Pass postToShare to the form
            onCancelShare={handleModalClose} // Allow form to trigger modal close/clear
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => setIsChatOpen(!isChatOpen);
  // const router = useRouter();
  // const { data: session, status } = useSession();

  // useEffect(() => {
  //   // This logic is bypassed for dev mode (always admin logged in)
  //   // if (status === 'unauthenticated') {
  //   //   router.push('/login');
  //   // }
  // }, [status, router]);

  // if (status === 'loading') {
  //   // This can be removed or simplified as AuthContext provides a static admin
  //   return (
  //     <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="mt-4 text-muted-foreground">Loading application...</p>
  //     </div>
  //   );
  // }

  // if (status === 'unauthenticated') {
  //   // This is bypassed
  //   return null;
  // }

  return (
    <FeedProvider>
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