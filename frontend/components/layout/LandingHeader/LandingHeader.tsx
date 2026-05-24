'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, User } from 'lucide-react';
import { useHeaderContext } from '../HeaderProvider';
import type { RecentNotification } from '@/lib/hooks/useHeaderData';
import styles from './LandingHeader.module.css';

const BANNER_INTERVAL_MS = 4500;
const BANNER_SLIDE_MS = 720;

const HEADER_BANNERS = [
  { href: '/balance', text: '오늘의 AI 수급 밸런스, 지금 확인해보세요' },
  { href: '/farm', text: '음성 영농일지로 스마트하게 농장 관리' },
  { href: '/shop', text: '양평 농가 직송, 신선 농산물 장터' },
  { href: '/community', text: '수다방에서 실전 영농 노하우 나눠요' },
  { href: '/policy/recommend', text: '내 농장에 꼭 맞는 지원 정책 찾기' },
  { href: '/stores', text: '양평 마을·체험, 동네 구경 떠나기' },
] as const;

const NOTIF_TYPE_ICONS: Record<string, string> = {
  BALANCE_WARN: '🚨',
  GUIDE: '💡',
  ORDER: '📦',
  POLICY: '📢',
  SYSTEM: '⚙️',
};

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}일 전`;
  if (hrs > 0) return `${hrs}시간 전`;
  if (mins > 0) return `${mins}분 전`;
  return '방금 전';
}

export default function LandingHeader() {
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

  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerLeavingIndex, setBannerLeavingIndex] = useState<number | null>(null);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [profileImageLoadFailed, setProfileImageLoadFailed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.email ? user.email.split('@')[0] : '';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (HEADER_BANNERS.length <= 1 || bannerPaused) return;

    const timer = window.setInterval(() => {
      setBannerIndex((prev) => {
        setBannerLeavingIndex(prev);
        return (prev + 1) % HEADER_BANNERS.length;
      });
    }, BANNER_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [bannerPaused]);

  useEffect(() => {
    if (bannerLeavingIndex === null) return;

    const timer = window.setTimeout(() => {
      setBannerLeavingIndex(null);
    }, BANNER_SLIDE_MS);

    return () => window.clearTimeout(timer);
  }, [bannerLeavingIndex, bannerIndex]);

  useEffect(() => {
    setProfileImageLoadFailed(false);
  }, [user?.profileImageUrl]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifToggle = async () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
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

  const handleCartClick = () => {
    router.push('/shop/cart');
  };

  const handleMobileNotifClick = () => {
    router.push('/mypage/notifications');
  };

  const onLogoutClick = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await handleLogout();
  };

  const renderBellIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  const renderCartIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );

  const renderNotifDropdown = () => (
    notifOpen && (
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
              <button
                key={n.id}
                type="button"
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
            ))}
          </div>
        )}
        <div className={styles.dropdownDivider} />
        <Link href="/mypage/notifications" className={styles.notifViewAll} onClick={() => setNotifOpen(false)}>
          전체 알림 보기 →
        </Link>
      </div>
    )
  );

  const renderUserAvatar = (size: 'desktop' | 'mobile') => {
    if (user?.profileImageUrl && !profileImageLoadFailed) {
      return (
        <Image
          src={user.profileImageUrl}
          alt="프로필"
          width={32}
          height={32}
          className={size === 'mobile' ? styles.mobileAvatarImg : styles.avatarImg}
          onError={() => setProfileImageLoadFailed(true)}
        />
      );
    }

    return (
      <span className={size === 'mobile' ? styles.mobileAvatarFallback : styles.avatar}>
        {displayName.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div className={styles.chromeRoot}>
      <div className={styles.mobileHeader}>
        <Link className={styles.mobileHeaderLogo} href="/">
          <img src="/logo.png" alt="FarmBalance" />
          <span className={styles.mobileHeaderLogoText}>FarmBalance</span>
        </Link>
        <div className={styles.mobileHeaderRight}>
          {user ? (
            <>
              <button type="button" className={styles.mobileHeaderIcon} aria-label="알림" onClick={handleMobileNotifClick}>
                {renderBellIcon()}
                {unreadCount > 0 && (
                  <span className={styles.mobileBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
              <button type="button" className={styles.mobileHeaderIcon} aria-label="장바구니" onClick={handleCartClick}>
                {renderCartIcon()}
                {cartCount > 0 && (
                  <span className={styles.mobileBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </button>
              <div className={styles.mobileUserArea} ref={mobileMenuRef}>
                <button
                  type="button"
                  className={styles.mobileUserBtn}
                  aria-label="프로필 메뉴"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                >
                  {renderUserAvatar('mobile')}
                </button>
                {mobileMenuOpen && (
                  <div className={styles.mobileDropdown}>
                    <div className={styles.dropdownHeader}>
                      <span className={styles.dropdownEmail}>{displayName}</span>
                      <span className={styles.dropdownRole}>{user.role}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link href="/mypage" className={styles.mobileDropdownItem} onClick={() => setMobileMenuOpen(false)}>
                      <User size={16} /> 마이페이지
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className={styles.mobileDropdownItem} onClick={() => setMobileMenuOpen(false)}>
                        <Shield size={16} /> 관리자 패널
                      </Link>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button type="button" className={`${styles.mobileDropdownItem} ${styles.mobileDropdownLogout}`} onClick={onLogoutClick}>
                      <LogOut size={16} /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link className={styles.mobileHeaderLogin} href="/login">
              로그인
            </Link>
          )}
        </div>
      </div>

      <header className={styles.header} id="header">
        <div className={styles['header__bar']}>
          <div className={`${styles['header__group']} ${styles['header__group--left']}`}>
            <div className={styles['header__brand']}>
              <Link className={styles['header__brand-logo-link']} href="/">
                <img
                  src="/logo.png"
                  alt="FarmBalance Logo"
                  width={32}
                  height={32}
                  style={{ objectFit: 'contain', borderRadius: '50%' }}
                />
              </Link>
              <div
                className={styles['header__banner-text']}
                onMouseEnter={() => setBannerPaused(true)}
                onMouseLeave={() => setBannerPaused(false)}
              >
                {HEADER_BANNERS.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles['header__banner-item']} ${
                      index === bannerIndex ? styles.header__bannerItemActive : ''
                    } ${index === bannerLeavingIndex ? styles.header__bannerItemLeave : ''}`}
                    aria-hidden={index !== bannerIndex}
                    tabIndex={index === bannerIndex ? 0 : -1}
                  >
                    {item.text}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <nav className={`${styles['header__group']} ${styles['header__group--center']}`}>
            <Link className={styles['header__nav-link']} href="/farm">내농장</Link>
            <Link className={styles['header__nav-link']} href="/shop">장터</Link>
            <Link className={styles['header__nav-link']} href="/community">수다방</Link>
            <Link className={styles['header__nav-link']} href="/stores">동네구경</Link>
            <Link className={styles['header__nav-link']} href="/policy">정책</Link>
          </nav>

          <div className={`${styles['header__group']} ${styles['header__group--right']}`}>
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className={styles.adminBtn}>
                    ⚙️ 관리자 패널
                  </Link>
                )}

                <div className={styles.notifArea} ref={notifRef}>
                  <button type="button" className={styles.iconBtn} onClick={handleNotifToggle} aria-label="알림">
                    {renderBellIcon()}
                    {unreadCount > 0 && (
                      <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </button>
                  {renderNotifDropdown()}
                </div>

                <button type="button" className={styles.iconBtn} onClick={handleCartClick} aria-label="장바구니">
                  {renderCartIcon()}
                  {cartCount > 0 && (
                    <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </button>

                <div className={styles.userArea} ref={dropdownRef}>
                  <button type="button" className={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {renderUserAvatar('desktop')}
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
                      <button type="button" className={styles.dropdownItem} onClick={onLogoutClick}>
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link className={styles['header__login-btn']} href="/login">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  로그인
                </Link>
                <Link className={styles['header__signup-btn']} href="/signup">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
