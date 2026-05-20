'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../gov.module.css';

const TABS = [
  { href: '/gov', label: '대시보드' },
  { href: '/gov/cultivation', label: '재배 현황' },
  { href: '/gov/compare', label: '연도 비교' },
  { href: '/gov/balance', label: '수급 분석' },
  { href: '/gov/sales', label: '판매 현황' },
  { href: '/gov/download', label: '데이터 다운로드' },
];

export default function GovTabs() {
  const pathname = usePathname();
  return (
    <div className={styles.tabs}>
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`${styles.tab} ${pathname === t.href ? styles.tabActive : ''}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
