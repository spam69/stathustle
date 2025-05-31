
"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider as AppAuthProvider } from '@/contexts/auth-context';
import { Toaster as AppToaster } from "@/components/ui/toaster";

// Create a client instance.
// It's important that this instance is stable and not re-created on every render.
// Placing it outside the component or using useState ensures this.
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
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
  );
}
