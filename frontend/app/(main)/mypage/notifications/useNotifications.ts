import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from './_lib/notification.api';
import { Notification } from './_lib/notification.types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterIsRead, setFilterIsRead] = useState<boolean | undefined>(undefined);

  // Pagination — useRef로 관리하여 useCallback 의존성 순환 방지
  const pageRef = useRef(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchNotifications = useCallback(async (reset: boolean = false) => {
    try {
      setIsLoading(true);
      const currentPage = reset ? 0 : pageRef.current;
      const res = await notificationApi.getNotifications(currentPage, 20, filterType, filterIsRead);
      
      if (reset) {
        setNotifications(res.data ?? []);
        pageRef.current = 1;
      } else {
        setNotifications((prev) => [...prev, ...(res.data ?? [])]);
        pageRef.current = currentPage + 1;
      }
      
      const total = res.meta?.totalElements ?? 0;
      setHasMore((reset ? 1 : currentPage + 1) * 20 < total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알림을 불러오는 데 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterIsRead]);

  // 최초 로드 및 필터 변경 시 리패치
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => 
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => 
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return {
    notifications,
    isLoading,
    error,
    hasMore,
    filterType,
    setFilterType,
    filterIsRead,
    setFilterIsRead,
    fetchMore: () => fetchNotifications(false),
    markAsRead,
    markAllAsRead,
    refetch: () => fetchNotifications(true),
  };
}
