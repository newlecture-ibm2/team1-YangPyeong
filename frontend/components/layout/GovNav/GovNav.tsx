'use client';

import Link from 'next/link';
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

  return (
    <nav className={styles.nav}>
      <Link href="/gov" className={styles.logo}>
        <Image src="/logo.png" alt="FarmBalance 로고" width={64} height={64} />
        <span>FarmBalance</span>
      </Link>

      <div className={styles.links}>
        {GOV_NAV_LINKS.map((link) => {
          const isActive =
            link.href === '/gov'
              ? pathname === '/gov'
              : pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${isActive ? styles['link--active'] : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className={styles.right}>
        <span className={styles.btnFill}>양평군 관리자</span>
      </div>
    </nav>
  );
}
