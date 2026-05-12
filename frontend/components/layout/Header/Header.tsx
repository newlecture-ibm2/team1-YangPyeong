'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import { useFCM } from './useFCM';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/farm', label: '내농장' },
  { href: '/shop', label: '장터' },
  { href: '/community', label: '수다방' },
  { href: '/stores', label: '동네구경' },
  { href: '/policy', label: '정책' },
];

interface HeaderUser {
  email: string;
  role: string;
  profileImageUrl?: string | null;
}

interface RecentNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIF_TYPE_ICONS: Record<string, string> = {
  BALANCE_WARN: '🚨',
  GUIDE: '💡',
  ORDER: '📦',
  POLICY: '📢',
  SYSTEM: '⚙️',
};

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

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [profileImageLoadFailed, setProfileImageLoadFailed] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 관련 상태
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<RecentNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  // 로컬에서 읽음 처리한 알림 ID를 기억 (서버 stale 데이터 방어)
  const localReadIds = useRef<Set<number>>(new Set());
  // 드롭다운 마지막 fetch 시간 (10초 캐시)
  const lastNotifFetchTime = useRef(0);

  // FCM Hook: 로그인 상태일 때 토큰 등록 및 백그라운드/포그라운드 리스너 활성화
  useFCM(!!user);

  useEffect(() => {
    setProfileImageLoadFailed(false);
  }, [user?.profileImageUrl]);

  // 쿠키에서 사용자 정보 읽기 + API에서 최신 프로필 정보(이미지 등) 조회
  useEffect(() => {
    const handleAuthChange = async () => {
      const cookieUser = getUserFromCookie();
      setUser(cookieUser);

      // 쿠키에 유저 정보가 있으면, 백엔드에서 최신 프로필(이미지 등)을 가져와 동기화
      if (cookieUser) {
        try {
          const res = await apiFetch<{ profileImageUrl?: string | null }>('/api/users/me');
          if (res.success && res.data) {
            const fetchedImageUrl = res.data.profileImageUrl || null;
            // 이미지가 다르거나 새로 들어온 경우 상태 및 쿠키 업데이트
            if (cookieUser.profileImageUrl !== fetchedImageUrl) {
              const updatedUser = { ...cookieUser, profileImageUrl: fetchedImageUrl };
              setUser(updatedUser);
              
              const expiration = new Date();
              expiration.setDate(expiration.getDate() + 7);
              document.cookie = `fb-user=${encodeURIComponent(JSON.stringify(updatedUser))}; path=/; expires=${expiration.toUTCString()}`;
            }
          }
        } catch {
          // 조회 실패 시 무시
        }
      }
    };

    handleAuthChange();

    // 인증 상태 변경 이벤트 구독
    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('cart-updated', handleAuthChange); // 장바구니 갱신 시 유저 정보도 재확인

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('cart-updated', handleAuthChange);
    };
  }, [pathname]);

  // 장바구니 수량 조회 (로그인 상태 + 페이지 이동 시 + cart-updated 이벤트)
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
        // 장바구니 조회 실패 시 무시
      }
    };
    fetchCartCount();

    // 장바구니 변경 이벤트 구독 (추가/삭제 시 즉시 반영)
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [user, pathname]);

  // 드롭다운 외부 클릭 시 닫기 (유저 드롭다운 + 알림 드롭다운)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 알림 unread count 폴링 (30초 간격)
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userRef.current) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const json = await res.json();
        setUnreadCount(json.data?.unreadCount ?? 0);
      }
    } catch {
      // 조회 실패 시 무시
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    
    // FCM 포그라운드 수신 시 로컬에서 즉시 +1 (서버 왔복 없이)
    const handleNotifReceived = () => {
      setUnreadCount((prev) => prev + 1);
    };
    window.addEventListener('notif-received', handleNotifReceived);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notif-received', handleNotifReceived);
    };
  }, [fetchUnreadCount]);

  // 서버에서 받아온 알림 목록에 로컬 읽음 상태를 합산
  const mergeReadState = useCallback((serverData: RecentNotification[]): RecentNotification[] => {
    return serverData.map((n) =>
      localReadIds.current.has(n.id) ? { ...n, isRead: true } : n
    );
  }, []);

  // 알림 드롭다운 열 때 최근 5개 조회 (10초 캐시)
  const handleNotifToggle = async () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    setDropdownOpen(false);

    if (nextState && user) {
      // 10초 이내 재열기면 캐시된 데이터 사용 (서버 요청 생략)
      const now = Date.now();
      if (now - lastNotifFetchTime.current < 10_000 && recentNotifs.length > 0) return;

      if (recentNotifs.length === 0) setNotifLoading(true);
      try {
        const res = await fetch('/api/notifications?page=0&size=5');
        if (res.ok) {
          const json = await res.json();
          setRecentNotifs(mergeReadState(json.data ?? []));
          lastNotifFetchTime.current = Date.now();
        }
      } catch {
        // 조회 실패 시 무시
      } finally {
        setNotifLoading(false);
      }
    }
  };

  // 알림 개별 클릭 → 읽음 처리 + 이동
  const handleNotifClick = async (notif: RecentNotification) => {
    // 1. 즉시 로컬 상태 업데이트 (UI 먼저 반영)
    if (!notif.isRead) {
      localReadIds.current.add(notif.id);
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      setRecentNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }

    // 2. 드롭다운 닫기 + 페이지 이동
    setNotifOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }

    // 3. 서버에 읽음 처리 (백그라운드)
    if (!notif.isRead) {
      fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' }).catch(() => {});
    }
  };

  // 상대 시간 포맷
  const timeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}일 전`;
    if (hrs > 0) return `${hrs}시간 전`;
    if (mins > 0) return `${mins}분 전`;
    return '방금 전';
  };

  const handleLogout = async () => {
    try {
      // FCM 토큰 삭제 (로그아웃 시 푸시 알림 중단)
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
      // ignore
    } finally {
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUser(null);
      setDropdownOpen(false);
      window.dispatchEvent(new Event('auth-changed'));
      router.push('/');
      router.refresh();
    }
  };


  /** 장바구니 클릭 — 로그인 체크 후 이동 */
  const handleCartClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/shop/cart');
  };

  /** 이메일에서 @ 앞 부분 추출 */
  const displayName = user?.email ? user.email.split('@')[0] : '';

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <Image src="/logo.png" alt="FarmBalance 로고" width={64} height={64} />
        <span>FarmBalance</span>
      </Link>

      <div className={styles.links}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${pathname?.startsWith(link.href) ? styles['link--active'] : ''}`}
            data-guide={`nav-${link.href.replace('/', '')}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className={styles.right}>
        {/* 🔔 알림 벨 버튼 */}
        {user && (
          <div className={styles.notifArea} ref={notifRef}>
            <button
              className={styles.notifBtn}
              onClick={handleNotifToggle}
              aria-label="알림"
              type="button"
              data-guide="notif-btn"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className={styles.notifBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifDropdownHeader}>
                  <span className={styles.notifDropdownTitle}>알림</span>
                  {unreadCount > 0 && (
                    <span className={styles.notifDropdownCount}>{unreadCount}개 안읽음</span>
                  )}
                </div>
                <div className={styles.notifDropdownDivider} />

                {notifLoading ? (
                  <div className={styles.notifEmpty}>
                    <div className={styles.notifSpinner} />
                  </div>
                ) : recentNotifs.length === 0 ? (
                  <div className={styles.notifEmpty}>새로운 알림이 없습니다.</div>
                ) : (
                  recentNotifs.map((n) => (
                    <button
                      key={n.id}
                      className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : styles.notifItemRead}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <span className={styles.notifItemIcon}>{NOTIF_TYPE_ICONS[n.type] || '🔔'}</span>
                      <span className={styles.notifItemContent}>
                        <span className={styles.notifItemTitle}>{n.title}</span>
                        <span className={styles.notifItemMessage}>{n.message}</span>
                        <span className={styles.notifItemTime}>{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  ))
                )}

                <div className={styles.notifDropdownDivider} />
                <Link
                  href="/mypage/notifications"
                  className={styles.notifViewAll}
                  onClick={() => setNotifOpen(false)}
                >
                  전체 알림 보기 →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 장바구니 버튼 */}
        <button
          className={styles.cartBtn}
          onClick={handleCartClick}
          aria-label="장바구니"
          type="button"
          data-guide="cart-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && (
            <span className={styles.cartBadge}>
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        {user ? (
          /* ── 로그인 상태 ── */
          <div className={styles.userArea} ref={dropdownRef}>
            <button
              className={styles.userBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user.profileImageUrl && !profileImageLoadFailed ? (
                <span className={styles.avatar}>
                  <Image
                    src={user.profileImageUrl}
                    alt="프로필"
                    width={32}
                    height={32}
                    className={styles.avatarImg}
                    onError={() => setProfileImageLoadFailed(true)}
                  />
                </span>
              ) : (
                <span className={styles.avatar}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className={styles.userName}>{displayName}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.5 }}>
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownEmail}>{user.email}</span>
                  <span className={styles.dropdownRole}>{user.role}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <Link href="/mypage" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                  마이페이지
                </Link>
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── 비로그인 상태 ── */
          <>
            <Link href="/login" className={styles.btnOutline}>
              로그인
            </Link>
            <Link href="/signup" className={styles.btnFill}>
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
