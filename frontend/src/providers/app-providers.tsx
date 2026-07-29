'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { NavigationLoader } from '@/components/ui/navigation-loader';
import { AppToaster } from '@/lib/toast';
import { AuthProvider } from '@/providers/auth-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="gm_theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppToaster />
          <NavigationLoader />
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
