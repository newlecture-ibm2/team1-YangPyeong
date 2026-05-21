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
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  data: {
    unreadCount: number;
  };
}

/** 알림 카테고리별 수신 설정 */
export interface NotificationPreference {
  balanceWarnEnabled: boolean;
  policyEnabled: boolean;
  orderEnabled: boolean;
  systemEnabled: boolean;
  guideWeatherEnabled: boolean;
  guideScheduleEnabled: boolean;
  guidePestEnabled: boolean;
  guideSoilEnabled: boolean;
}

export interface NotificationPreferenceResponse {
  data: NotificationPreference;
}

/** 부분 업데이트용 — 전송할 필드만 포함 */
export type NotificationPreferenceUpdateRequest = Partial<NotificationPreference>;
