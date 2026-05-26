'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useGovUser } from '@/app/gov/useGovUser';
import { apiFetch } from '@/lib/api-fetch';
import styles from './GovNav.module.css';

/**
 * 지자체 전용 네비게이션 바
 * - 일반 사용자(Nav.tsx)와 메뉴 구성이 다름
 * - 대시보드 / 수급관리 / 농가관리 / 정책
 */
const TYPE_LABEL_MAP: Record<string, string> = {
  CULTIVATION: '재배 현황',
  BALANCE: '수급 현황',
  SALES: '판매 데이터',
  FARM: '농가 목록',
};

export default function GovNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useGovUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [bannerText, setBannerText] = useState('실시간 AI 기반 작물 수급 분석 데이터 제공');

  useEffect(() => {
    fetch('/api/gov/download/history')
      .then(res => res.json())
      .then(json => {
        const defaultMessages = [
          '🌾 양평군 실시간 AI 기반 작물 수급 분석 엔진 동작 중',
          '📊 읍면별 재배 현황 및 연도별 생산량 비교 통계 제공',
          '💡 AI 수급 예측 가이드를 통한 농가 소득 안정화 지원'
        ];
        
        let messages = [...defaultMessages];

        if (json.success !== false && json.data && json.data.length > 0) {
          const historyMessages = json.data.slice(0, 3).map((item: any) => {
            const typeLabel = TYPE_LABEL_MAP[item.type] || '데이터';
            const dateStr = item.createdAt ? item.createdAt.slice(0, 10) : '';
            return `📥 [최신 자료] ${typeLabel} 내보내기 완료 (${dateStr})`;
          });
          messages = [...historyMessages, ...defaultMessages];
        }
        
        setBannerText(messages.join('    •    '));
      })
      .catch(() => {
        // ignore
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <div className={`${styles.headerBar} ${scrolled ? styles.headerBarScrolled : ''}`}>
        <div className={`${styles.group} ${styles.groupLeft}`}>
          <Link href="/gov" className={styles.logo}>
            <Image src="/logo.png" alt="FarmBalance 로고" width={32} height={32} className={styles.logoIcon} />
            <span>FarmBalance</span>
          </Link>
        </div>

        <div className={`${styles.group} ${styles.groupCenter}`}>
          <div className={styles.bannerTicker}>
            <div className={styles.tickerWrapper}>
              <span className={styles.tickerItem}>{bannerText}</span>
              <span className={styles.tickerItem}>{bannerText}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.group} ${styles.groupRight}`} ref={dropdownRef}>
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
      </div>
    </nav>
  );
}
