'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

// ─── Silently wake the Render backend on app load ──────────────────────────
// Render free tier sleeps after 15 min of inactivity. This ping fires when
// the app first mounts so by the time the user makes a real API call,
// the backend is already warm.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function useWakeBackend() {
  useEffect(() => {
    fetch(`${API_URL}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {
      // Silently ignore — this is just a best-effort warm-up ping
    });
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useWakeBackend();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,      // 2 min — prevents redundant refetches
            gcTime: 10 * 60 * 1000,          // 10 min — keep unused data in cache longer
            retry: 2,
            refetchOnWindowFocus: false,      // stop burst-refetch when switching tabs
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#111827',
            color: '#f9fafb',
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#f9fafb' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
        }}
      />
    </QueryClientProvider>
  );
}
