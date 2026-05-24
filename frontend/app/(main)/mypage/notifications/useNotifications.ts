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

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotifications = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications(page, 10, filterType, filterIsRead);
      
      setNotifications(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 0);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알림을 불러오는 데 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterIsRead]);

  // 최초 로드 및 필터 변경 시 첫 페이지 리패치
  useEffect(() => {
    fetchNotifications(0);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      // optimistic update — 재조회 없이 UI만 갱신 (scroll 초기화 방지)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // 헤더 배지 카운트만 동기화 (페이지 자체는 재조회하지 않음)
      window.dispatchEvent(new CustomEvent('notif-read-changed', { detail: { source: 'page' } }));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      // optimistic update — 재조회 없이 UI만 갱신 (scroll 초기화 방지)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      // 헤더 배지 카운트만 동기화 (페이지 자체는 재조회하지 않음)
      window.dispatchEvent(new CustomEvent('notif-read-changed', { detail: { source: 'page' } }));
    } catch (err) {
      console.error(err);
    }
  };

  return {
    notifications,
    isLoading,
    error,
    currentPage,
    totalPages,
    setPage: fetchNotifications,
    filterType,
    setFilterType,
    filterIsRead,
    setFilterIsRead,
    markAsRead,
    markAllAsRead,
    refetch: () => fetchNotifications(currentPage),
  };
}
