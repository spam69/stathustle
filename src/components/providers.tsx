
"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider as AppAuthProvider } from '@/contexts/auth-context';
import { NotificationProvider } from '@/contexts/notification-context'; // Import NotificationProvider
import { Toaster as AppToaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react"; 

// Create a client instance.
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider> 
      <TanstackQueryClientProvider client={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppAuthProvider>
            <NotificationProvider> {/* Wrap with NotificationProvider */}
              {children}
              <AppToaster />
            </NotificationProvider>
          </AppAuthProvider>
        </NextThemesProvider>
      </TanstackQueryClientProvider>
    </SessionProvider>
  );
}
