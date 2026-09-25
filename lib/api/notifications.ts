import { apiClient } from './client';

export interface Notification {
  id: string;
  type: 'game' | 'raffle' | 'subscription' | 'leaderboard' | 'feature' | string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  // Additional metadata fields that may be present in backend response
  amount?: number;
  packageName?: string;
  tokens?: number;
  points?: number;
  rank?: number;
  metadata?: Record<string, any>;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface GetNotificationsParams {
  unread?: boolean;
  page?: number;
  size?: number;
}

/**
 * Get all notifications for the current user with pagination
 * @param params - Query parameters for filtering and pagination
 */
export async function getNotifications(params?: GetNotificationsParams): Promise<Notification[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.unread !== undefined) {
    queryParams.append('unread', String(params.unread));
  }
  if (params?.page !== undefined) {
    queryParams.append('page', String(params.page));
  }
  if (params?.size !== undefined) {
    queryParams.append('size', String(params.size));
  }
  
  const endpoint = queryParams.toString() 
    ? `/api/v1/notifications?${queryParams.toString()}`
    : '/api/v1/notifications';
  
  return apiClient<Notification[]>(endpoint, {
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
