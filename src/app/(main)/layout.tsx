
"use client";
import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LifeBuoy } from 'lucide-react';
import LiveSupportChat from '@/components/live-support-chat';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
      <SidebarProvider>
        <div className="flex min-h-screen flex-col">
          <Header toggleChat={toggleChat} />
          {/* Removed pt-16 from this div, and fixed positioning from Sidebar component */}
          <div className="flex flex-1"> 
            <Sidebar collapsible="icon"> {/* Removed className for fixed positioning */}
              <SidebarContent>
                <SidebarNav />
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              {/* Removed explicit height and overflow from main element */}
              <main className="flex-1 p-4 md:p-6 lg:p-8">
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
  );
}
