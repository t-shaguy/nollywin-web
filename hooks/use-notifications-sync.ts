import { useEffect, useState } from 'react';
import { getUnreadCount } from '@/lib/api/notifications';

/**
 * Hook to sync notification unread count from the backend.
 * Fetches on mount and refreshes periodically.
 */
export function useNotificationsSync() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchUnreadCount() {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchUnreadCount();

    // Refresh every 60 seconds
    intervalId = setInterval(fetchUnreadCount, 60000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return { unreadCount, loading };
}
