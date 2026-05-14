'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useGovUser } from '@/app/gov/useGovUser';
import { apiFetch } from '@/lib/api-fetch';
import styles from '@/components/layout/Header/Header.module.css';

/**
 * 지자체 전용 네비게이션 바
 * - 일반 사용자(Nav.tsx)와 메뉴 구성이 다름
 * - 대시보드 / 수급관리 / 농가관리 / 정책
 */
const GOV_NAV_LINKS = [
  { href: '/gov', label: '대시보드' },
  { href: '/gov/cultivation', label: '재배 현황' },
  { href: '/gov/compare', label: '연도 비교' },
  { href: '/gov/sales', label: '판매 현황' },
  { href: '/gov/download', label: '데이터 다운로드' },
];

export default function GovNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useGovUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
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
      setDropdownOpen(false);
      window.dispatchEvent(new Event('auth-changed'));
      router.push('/login');
      router.refresh();
    }
  };

  const displayName = loading ? "로딩 중..." : (user?.regionName ? `${user.regionName} 담당자` : "양평군 담당자");

  return (
    <nav className={styles.nav}>
      <Link href="/gov" className={styles.logo}>
        <Image src="/logo.png" alt="FarmBalance 로고" width={64} height={64} />
        <span>FarmBalance</span>
      </Link>

      <div className={styles.links}>
        {/* 지자체 상단 헤더 메뉴 제거 (GovTabs로 대체) */}
      </div>

      <div className={styles.right} ref={dropdownRef}>
        <div style={{ position: 'relative' }}>
          <button 
            className={styles.btnFill} 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
          >
            <span>{displayName}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.8 }}>
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className={styles.dropdown} style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px' }}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownEmail}>{user?.email || 'gov@farmbalance.kr'}</span>
                <span className={styles.dropdownRole}>GOV</span>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={handleLogout} style={{ width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
