
"use client";

import type { ReactNode } from 'react';
import { useState } from 'react'; // Import useState
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider as AppAuthProvider } from '@/contexts/auth-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { CommentsModalProvider } from '@/contexts/comments-modal-context';
import { FeedProvider } from '@/contexts/feed-context';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { Toaster as AppToaster } from "@/components/ui/toaster";

// queryClient instance is now created inside the component using useState
// const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  // Ensure QueryClient is only instantiated once per client-side render tree
  const [queryClient] = useState(() => new QueryClient());

  return (
    // SessionProvider is removed
    <TanstackQueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppAuthProvider>
          <NotificationProvider>
            <FeedProvider>
              <CommentsModalProvider>
                <MessagingProvider>
                  {children}
                  <AppToaster />
                </MessagingProvider>
              </CommentsModalProvider>
            </FeedProvider>
          </NotificationProvider>
        </AppAuthProvider>
      </NextThemesProvider>
    </TanstackQueryClientProvider>
  );
}
