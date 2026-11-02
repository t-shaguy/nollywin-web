"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Helper to determine if an error is retryable
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as { status?: number; name?: string };
  
  // Network errors - always retry
  if (err.status === 0 || err.name === "AbortError") return true;
  
  // 5xx errors - server issues, worth retrying
  if (err.status && err.status >= 500) return true;
  
  // 408 Request Timeout - retry
  if (err.status === 408) return true;
  
  // 429 Rate Limit - retry with backoff
  if (err.status === 429) return true;
  
  // Don't retry 4xx client errors (400, 401, 403, 404, etc.)
  return false;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 60 seconds - data fresh for 1 minute
        refetchOnWindowFocus: false, // Disable refetch on focus to prevent hammering
        refetchOnMount: true, // Only refetch when component mounts
        
        // Smart retry logic - only retry on network/5xx/timeout errors
        retry: (failureCount, error) => {
          // Max 2 retries
          if (failureCount >= 2) return false;
          
          // Only retry if error is retryable (network/5xx/timeout)
          return isRetryableError(error);
        },
        
        // Exponential backoff: 1s, 2s, 4s
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
        
        // Keep previous data during refetch (smoother UX)
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Don't retry mutations by default (POST/PUT/DELETE should be idempotent if retried)
        retry: false,
      },
    },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
