import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUnreadCount } from '@/lib/api/notifications';

/**
 * Hook to sync notification unread count from the backend.
 * Uses React Query with automatic refetching, and listens for manual refresh events.
 */
export function useNotificationsSync() {
  const queryClient = useQueryClient();
  
  const { data: unreadCount = 0, isLoading: loading } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: false, // Disable auto-refresh
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    retry: 1,
  });

  useEffect(() => {
    // Listen for manual refresh events (triggered after mark-read actions)
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    
    window.addEventListener('notifications-updated', handleRefresh);

    return () => {
      window.removeEventListener('notifications-updated', handleRefresh);
    };
  }, [queryClient]);

  return { unreadCount, loading };
}
