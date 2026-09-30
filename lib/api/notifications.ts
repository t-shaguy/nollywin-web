import { apiClient } from './client';

export interface Notification {
  id: string;
  type: string; // e.g. "WALLET_TOPUP", "SUBSCRIPTION_ACTIVATED" - open string for future types
  title: string;
  body: string; // Complete human-readable message from backend
  data?: Record<string, any>; // Varies by type - e.g. { tokens: "5", reference: "..." }
  read: boolean;
  createdAt: string; // ISO 8601 date string
}

export interface UnreadCountResponse {
  unread: number;
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
  return response.unread;
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  console.log(`[API] Calling POST /api/v1/notifications/${notificationId}/read`);
  try {
    const response = await apiClient(`/api/v1/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    console.log(`[API] Mark as read successful for ID: ${notificationId}`, response);
  } catch (error) {
    console.error(`[API] Mark as read FAILED for ID: ${notificationId}`, error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  console.log('[API] Calling POST /api/v1/notifications/read-all');
  try {
    const response = await apiClient('/api/v1/notifications/read-all', {
      method: 'POST',
    });
    console.log('[API] Mark all as read successful', response);
  } catch (error) {
    console.error('[API] Mark all as read FAILED', error);
    throw error;
  }
}

/**
 * Delete a notification (soft delete - removes from user's inbox only)
 * DELETE /api/v1/notifications/{notificationId}
 * 
 * Returns 204 No Content on success.
 * 404 if already deleted or doesn't belong to user - treated as success since
 * the desired end state (notification gone from list) is achieved either way.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  console.log(`[API] Calling DELETE /api/v1/notifications/${notificationId}`);
  try {
    await apiClient(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    console.log(`[API] Delete notification successful for ID: ${notificationId}`);
  } catch (error: any) {
    // 404 means already gone - treat as success
    if (error?.status === 404) {
      console.log(`[API] Notification ${notificationId} already deleted (404) - treating as success`);
      return;
    }
    console.error(`[API] Delete notification FAILED for ID: ${notificationId}`, error);
    throw error;
  }
}
