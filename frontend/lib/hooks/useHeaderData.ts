'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';

export interface HeaderUser {
  email: string;
  name?: string | null;
  role: string;
  profileImageUrl?: string | null;
}

export interface RecentNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

/** 클라이언트 쿠키에서 fb-user 읽기 */
function getUserFromCookie(): HeaderUser | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)fb-user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

/**
 * Header 데스크탑/모바일 변형 모두에서 사용하는 공용 상태/효과.
 * - 쿠키에서 user 읽고 프로필 동기화
 * - 장바구니 수량 폴링
 * - 알림 unread count 폴링
 * - 알림 목록 lazy fetch (드롭다운 열 때만 호출)
 */
export function useHeaderData() {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<RecentNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const localReadIds = useRef<Set<number>>(new Set());
  const lastNotifFetchTime = useRef(0);

  // ── 사용자 정보 동기화 ──
  useEffect(() => {
    const handleAuthChange = async () => {
      const cookieUser = getUserFromCookie();
      setUser(cookieUser);

      if (cookieUser) {
        try {
          const res = await apiFetch<{ name?: string | null; profileImageUrl?: string | null }>('/api/users/me');
          if (res.success && res.data) {
            const fetchedImageUrl = res.data.profileImageUrl || null;
            const fetchedName = res.data.name || null;
            if (cookieUser.profileImageUrl !== fetchedImageUrl || cookieUser.name !== fetchedName) {
              const updatedUser = { ...cookieUser, profileImageUrl: fetchedImageUrl, name: fetchedName };
              setUser(updatedUser);
              const expiration = new Date();
              expiration.setDate(expiration.getDate() + 7);
              document.cookie = `fb-user=${encodeURIComponent(JSON.stringify(updatedUser))}; path=/; expires=${expiration.toUTCString()}`;
            }
          }
        } catch {
          // 무시
        }
      }
    };

    handleAuthChange();
    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('cart-updated', handleAuthChange);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('cart-updated', handleAuthChange);
    };
  }, []);

  // ── 장바구니 수량 ──
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    const fetchCartCount = async () => {
      try {
        const res = await apiFetch<Array<{ id: number }>>('/api/shop/cart');
        if (res.success && res.data) {
          setCartCount(res.data.length);
        }
      } catch {
        // 무시
      }
    };
    fetchCartCount();
    const handleCartUpdate = () => fetchCartCount();
    // 챗봇 REFRESH scope=cart 이벤트도 동일하게 처리
    const handleChatRefresh = (e: Event) => {
      const detail = (e as CustomEvent<{ scope: string }>).detail;
      if (detail?.scope === 'cart') fetchCartCount();
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('chat:refresh', handleChatRefresh);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('chat:refresh', handleChatRefresh);
    };
  }, [user]);

  // ── 알림 unread count ──
  const isLoggedIn = !!user;
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count');
        if (res.ok) {
          const json = await res.json();
          setUnreadCount(json.data?.unreadCount ?? 0);
        }
      } catch {
        // 무시
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);

    const handleNotifReceived = () => {
      setUnreadCount((prev) => prev + 1);
      lastNotifFetchTime.current = 0;
    };
    window.addEventListener('notif-received', handleNotifReceived);

    const handleReadChanged = () => {
      fetchCount();
      lastNotifFetchTime.current = 0;
    };
    window.addEventListener('notif-read-changed', handleReadChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notif-received', handleNotifReceived);
      window.removeEventListener('notif-read-changed', handleReadChanged);
    };
  }, [isLoggedIn]);

  // ── 알림 목록 lazy fetch ──
  const mergeReadState = useCallback(
    (serverData: RecentNotification[]): RecentNotification[] =>
      serverData.map((n) => (localReadIds.current.has(n.id) ? { ...n, isRead: true } : n)),
    [],
  );

  const fetchRecentNotifs = useCallback(async (force = false) => {
    if (!force && Date.now() - lastNotifFetchTime.current < 10_000 && recentNotifs.length > 0) {
      return;
    }
    if (recentNotifs.length === 0) setNotifLoading(true);
    try {
      const res = await fetch('/api/notifications?page=0&size=10&isRead=false');
      if (res.ok) {
        const json = await res.json();
        setRecentNotifs(mergeReadState(json.data ?? []));
        lastNotifFetchTime.current = Date.now();
      }
    } catch {
      // 무시
    } finally {
      setNotifLoading(false);
    }
  }, [recentNotifs.length, mergeReadState]);

  /** 개별 알림 읽음 처리 (로컬 + 서버) */
  const markNotifRead = useCallback((notifId: number) => {
    localReadIds.current.add(notifId);
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    setRecentNotifs((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
    );
    lastNotifFetchTime.current = 0;
    fetch(`/api/notifications/${notifId}/read`, { method: 'PATCH' })
      .then(() => window.dispatchEvent(new Event('notif-read-changed')))
      .catch(() => {});
  }, []);

  /** 로그아웃 처리 (FCM 토큰 제거 + 쿠키 제거 + auth-changed 이벤트) */
  const handleLogout = useCallback(async () => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('fcm-token') : null;
      if (savedToken) {
        await fetch('/api/fcm/tokens', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: savedToken }),
        }).catch(() => {});
        localStorage.removeItem('fcm-token');
      }
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 무시
    } finally {
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUser(null);
      window.dispatchEvent(new Event('auth-changed'));
      router.push('/');
      router.refresh();
    }
  }, [router]);

  return {
    user,
    setUser,
    cartCount,
    unreadCount,
    recentNotifs,
    notifLoading,
    fetchRecentNotifs,
    markNotifRead,
    handleLogout,
  };
}
