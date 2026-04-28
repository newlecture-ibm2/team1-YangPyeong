'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { href: '/balance', label: '밸런스' },
  { href: '/recommend', label: 'AI 추천' },
  { href: '/community', label: '커뮤니티' },
  { href: '/policy', label: '정책' },
  { href: '/shop', label: '상점' },
  { href: '/stores', label: '가게' },
];

/** 클라이언트 쿠키에서 fb-user 읽기 */
function getUserFromCookie(): { email: string; role: string } | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)fb-user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 쿠키에서 사용자 정보 읽기 (매 pathname 변경 시)
  useEffect(() => {
    setUser(getUserFromCookie());
  }, [pathname]);

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
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
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
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className={styles.right}>
        {user ? (
          /* ── 로그인 상태 ── */
          <div className={styles.userArea} ref={dropdownRef}>
            <button
              className={styles.userBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className={styles.avatar}>
                {displayName.charAt(0).toUpperCase()}
              </span>
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
