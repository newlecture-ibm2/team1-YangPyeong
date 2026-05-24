'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useHeaderContext } from '../HeaderProvider';
import type { RecentNotification } from '@/lib/hooks/useHeaderData';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/farm', label: '내농장' },
  { href: '/shop', label: '장터' },
  { href: '/community', label: '수다방' },
  { href: '/stores', label: '동네구경' },
  { href: '/policy', label: '정책' },
];

const NOTIF_TYPE_ICONS: Record<string, string> = {
  BALANCE_WARN: '🚨',
  GUIDE: '💡',
  ORDER: '📦',
  POLICY: '📢',
  SYSTEM: '⚙️',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    cartCount,
    unreadCount,
    recentNotifs,
    notifLoading,
    fetchRecentNotifs,
    markNotifRead,
    handleLogout,
  } = useHeaderContext();

  const [profileImageLoadFailed, setProfileImageLoadFailed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // 프로필 이미지 URL 변경 시 에러 상태 리셋
  useEffect(() => {
    setProfileImageLoadFailed(false);
  }, [user?.profileImageUrl]);

  // 드롭다운 외부 클릭 시 닫기
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

  const handleNotifToggle = async () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    setDropdownOpen(false);
    if (nextState && user) {
      await fetchRecentNotifs();
    }
  };

  const handleNotifClick = (notif: RecentNotification) => {
    if (!notif.isRead) {
      markNotifRead(notif.id);
    }
    setNotifOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

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

  const handleCartClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/shop/cart');
  };

  const onLogoutClick = async () => {
    setDropdownOpen(false);
    await handleLogout();
  };

  const displayName = user?.email ? user.email.split('@')[0] : '';

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={`${styles.headerBar} ${scrolled ? styles.headerBarScrolled : ''}`}>
        
        {/* 왼쪽: 로고 + 배너 */}
        <div className={`${styles.group} ${styles.groupLeft}`}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="FarmBalance" width={32} height={32} className={styles.logoIcon} />
            <div className={styles.bannerText}>
              <div className={styles.bannerCarousel}>
                <span className={styles.bannerItem}>AI 기반 실시간 수급 예측 확인</span>
                <span className={styles.bannerItem}>스마트한 영농 일지, 농장 관리</span>
                <span className={styles.bannerItem}>양평 농가 직거래 마켓 바로가기</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 가운데: 네비게이션 링크 */}
        <div className={`${styles.group} ${styles.groupCenter}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname?.startsWith(link.href) ? styles['link--active'] : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* 오른쪽: 버튼 영역 */}
        <div className={`${styles.group} ${styles.groupRight}`}>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className={styles.adminBtn}>
              ⚙️ 관리자 패널
            </Link>
          )}

          {user && (
            <div className={styles.notifArea} ref={notifRef}>
              <button className={styles.iconBtn} onClick={handleNotifToggle} aria-label="알림">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifDropdownHeader}>
                    <span className={styles.notifDropdownTitle}>알림</span>
                    {unreadCount > 0 && <span className={styles.notifDropdownCount}>{unreadCount}개 안읽음</span>}
                  </div>
                  <div className={styles.dropdownDivider} />
                  {notifLoading ? (
                    <div className={styles.notifEmpty}><div className={styles.notifSpinner} /></div>
                  ) : recentNotifs.length === 0 ? (
                    <div className={styles.notifEmpty}>새로운 알림이 없습니다.</div>
                  ) : (
                    <div className={styles.notifList}>
                      {recentNotifs.map((n) => (
                        <button key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : styles.notifItemRead}`} onClick={() => handleNotifClick(n)}>
                          <span className={styles.notifItemIcon}>{NOTIF_TYPE_ICONS[n.type] || '🔔'}</span>
                          <span className={styles.notifItemContent}>
                            <span className={styles.notifItemTitle}>{n.title}</span>
                            <span className={styles.notifItemMessage}>{n.message}</span>
                            <span className={styles.notifItemTime}>{timeAgo(n.createdAt)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={styles.dropdownDivider} />
                  <Link href="/mypage/notifications" className={styles.notifViewAll} onClick={() => setNotifOpen(false)}>
                    전체 알림 보기 →
                  </Link>
                </div>
              )}
            </div>
          )}

          {user && (
            <button className={styles.iconBtn} onClick={handleCartClick} aria-label="장바구니">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>}
            </button>
          )}

          {user ? (
            <div className={styles.userArea} ref={dropdownRef}>
              <button className={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user.profileImageUrl && !profileImageLoadFailed ? (
                  <span className={styles.avatar}>
                    <Image src={user.profileImageUrl} alt="프로필" width={32} height={32} className={styles.avatarImg} onError={() => setProfileImageLoadFailed(true)} />
                  </span>
                ) : (
                  <span className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</span>
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
                  <Link href="/mypage" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>마이페이지</Link>
                  <button className={styles.dropdownItem} onClick={onLogoutClick}>로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.btnOutline}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                로그인
              </Link>
              <Link href="/signup" className={styles.btnFill}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
