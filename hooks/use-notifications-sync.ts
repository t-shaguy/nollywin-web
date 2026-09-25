import { useEffect, useState } from 'react';
import { getUnreadCount } from '@/lib/api/notifications';

/**
 * Hook to sync notification unread count from the backend.
 * Fetches on mount, refreshes periodically, and listens for manual refresh events.
 */
export function useNotificationsSync() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Initial fetch
    fetchUnreadCount();

    // Refresh every 60 seconds
    intervalId = setInterval(fetchUnreadCount, 60000);
    
    // Listen for manual refresh events (triggered after mark-read actions)
    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener('notifications-updated', handleRefresh);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('notifications-updated', handleRefresh);
    };
  }, []);

  return { unreadCount, loading };
}
