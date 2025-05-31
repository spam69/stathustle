
"use client"; 
import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { Sidebar, SidebarProvider, SidebarInset, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
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
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-2 flex items-center justify-between">
           {/* Logo can go here if needed, or just trigger */}
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header toggleChat={toggleChat} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        
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

      </SidebarInset>
    </SidebarProvider>
  );
}
