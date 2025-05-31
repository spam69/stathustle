
"use client"; 
import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '@/components/layout/header';
// Sidebar components are temporarily removed for debugging context issue
// import SidebarNav from '@/components/layout/sidebar-nav';
// import { Sidebar, SidebarProvider, SidebarInset, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LifeBuoy } from 'lucide-react';
import LiveSupportChat from '@/components/live-support-chat'; 
import { FeedProvider } from '@/contexts/feed-context';
import type { Post as PostType } from '@/types';
import { mockPosts } from '@/lib/mock-data';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  console.log("MainLayout rendering - FeedProvider is next. TEMP: Sidebar removed."); // DEBUG LOG

  return (
    <FeedProvider initialPosts={mockPosts}>
      <div className="flex min-h-screen flex-col"> {/* Simplified wrapper instead of SidebarProvider/Inset */}
        <Header toggleChat={toggleChat} /> {/* Header is now more directly under FeedProvider's scope */}
        <div className="flex flex-1"> {/* Mimic structure for main content area */}
          {/* Sidebar would normally go here or be part of the overall structure */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
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
      </div>
    </FeedProvider>
  );
}
