export interface Notification {
  id: number;
  type: 'BALANCE_WARN' | 'GUIDE' | 'ORDER' | 'POLICY' | 'SYSTEM';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  data: Notification[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
  };
}

export interface UnreadCountResponse {
  data: {
    unreadCount: number;
  };
}
