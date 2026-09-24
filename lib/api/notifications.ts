import { apiClient } from './client';

export interface Notification {
  id: string;
  type: 'game' | 'raffle' | 'subscription' | 'leaderboard' | 'feature';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(): Promise<Notification[]> {
  return apiClient<Notification[]>('/api/v1/notifications', {
    method: 'GET',
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient<UnreadCountResponse>('/api/v1/notifications/unread-count', {
    method: 'GET',
  });
  return response.unreadCount;
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  await apiClient('/api/v1/notifications/read-all', {
    method: 'POST',
  });
}
