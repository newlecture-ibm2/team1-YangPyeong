'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
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
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
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
              {user.profileImageUrl ? (
                <span className={styles.avatar}>
                  <Image
                    src={user.profileImageUrl}
                    alt="프로필"
                    width={32}
                    height={32}
                    className={styles.avatarImg}
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
