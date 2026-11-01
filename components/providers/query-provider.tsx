"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 60 seconds - data fresh for 1 minute
        retry: 1, // Only retry once
        refetchOnWindowFocus: false, // Disable refetch on focus to prevent hammering
        refetchOnMount: true, // Only refetch when component mounts
      },
    },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
