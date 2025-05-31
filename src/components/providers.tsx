
"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider as AppAuthProvider } from '@/contexts/auth-context';
import { Toaster as AppToaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider

// Create a client instance.
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider> {/* Wrap with SessionProvider at the top level */}
      <TanstackQueryClientProvider client={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppAuthProvider>
            {children}
            <AppToaster />
          </AppAuthProvider>
        </NextThemesProvider>
      </TanstackQueryClientProvider>
    </SessionProvider>
  );
}
