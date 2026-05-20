import {
  NotificationPreference,
  NotificationPreferenceResponse,
  NotificationPreferenceUpdateRequest,
  NotificationResponse,
  UnreadCountResponse,
} from './notification.types';

export const notificationApi = {
  getNotifications: async (
    page: number = 0,
    size: number = 20,
    type?: string,
    isRead?: boolean
  ): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (type) params.append('type', type);
    if (isRead !== undefined) params.append('isRead', isRead.toString());

    const res = await fetch(`/api/notifications?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await fetch('/api/notifications/unread-count');
    if (!res.ok) throw new Error('Failed to fetch unread count');
    return res.json();
  },

  markAsRead: async (id: number): Promise<void> => {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark as read');
  },

  markAllAsRead: async (): Promise<void> => {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
  },

  getPreferences: async (): Promise<NotificationPreference> => {
    const res = await fetch('/api/notifications/preferences');
    if (!res.ok) throw new Error('Failed to fetch notification preferences');
    const body: NotificationPreferenceResponse = await res.json();
    return body.data;
  },

  updatePreferences: async (
    request: NotificationPreferenceUpdateRequest
  ): Promise<NotificationPreference> => {
    const res = await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Failed to update notification preferences');
    const body: NotificationPreferenceResponse = await res.json();
    return body.data;
  },
};
