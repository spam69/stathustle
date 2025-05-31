
"use client";
import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LifeBuoy } from 'lucide-react';
import LiveSupportChat from '@/components/live-support-chat';
// FeedProvider removed

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    // FeedProvider removed
      <SidebarProvider>
        <div className="flex min-h-screen flex-col">
          <Header toggleChat={toggleChat} />
          <div className="flex flex-1 pt-16"> {/* Added pt-16 to account for sticky header */}
            <Sidebar collapsible="icon" className="fixed top-16 bottom-0 z-20 h-[calc(100vh_-_4rem)]"> {/* Added className for positioning */}
              <SidebarContent>
                <SidebarNav />
              </SidebarContent>
            </Sidebar>
            <SidebarInset> {/* This will now correctly be offset by the sidebar */}
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
        </div>
      </SidebarProvider>
    // FeedProvider removed
  );
}
