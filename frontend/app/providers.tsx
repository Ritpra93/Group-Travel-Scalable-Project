/**
 * Application Providers
 * Wraps the app with necessary context providers
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { AuthGuard } from '@/components/providers/auth-guard';
import { SocketConnectionManager } from '@/components/providers/socket-connection-manager';

// ============================================================================
// Providers Component
// ============================================================================

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient instance (one per request)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache time: 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests
            retry: 1,
            // Refetch on window focus (useful for real-time updates)
            refetchOnWindowFocus: true,
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SocketConnectionManager />
      <AuthGuard>
        {children}
      </AuthGuard>
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
