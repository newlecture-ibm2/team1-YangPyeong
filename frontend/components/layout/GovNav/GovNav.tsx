'use client';

import Link from 'next/link';
import { useGovUser } from '@/app/gov/_hooks/useGovUser';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from '@/components/layout/Nav/Nav.module.css';

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
  const { user } = useGovUser();

  return (
    <nav className={styles.nav}>
      <Link href="/gov" className={styles.logo}>
        <Image src="/logo.png" alt="FarmBalance 로고" width={64} height={64} />
        <span>FarmBalance</span>
      </Link>

      <div className={styles.links}>
        {/* 지자체 상단 헤더 메뉴 제거 (GovTabs로 대체) */}
      </div>

      <div className={styles.right} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* 개발용 테스트 스위처 */}
        <select 
          onChange={(e) => {
            localStorage.setItem('X-USER-ID', e.target.value);
            window.location.reload();
          }}
          value={typeof window !== 'undefined' ? localStorage.getItem('X-USER-ID') || '9040' : '9040'}
          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="9040">양평군(9040)</option>
          <option value="9041">가평군(9041)</option>
          <option value="9010">권한없음 유저</option>
        </select>

        <span className={styles.btnFill}>{user?.region ? `${user.region} 담당자` : "로딩 중..."}</span>
      </div>
    </nav>
  );
}
