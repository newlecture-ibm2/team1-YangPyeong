'use client';

import Link from 'next/link';
import { useGovUser } from '@/app/gov/useGovUser';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  const { user, loading } = useGovUser();

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
        <span className={styles.btnFill}>
          {loading ? "로딩 중..." : (user?.regionName ? `${user.regionName} 담당자` : "양평군 담당자")}
        </span>
      </div>
    </nav>
  );
}
