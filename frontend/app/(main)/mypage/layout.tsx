'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

const MYPAGE_TABS = [
  { href: '/mypage', label: '프로필', icon: '👤' },
  { href: '/mypage/notifications', label: '알림', icon: '🔔' },
  { href: '/mypage/history', label: '주문내역', icon: '📦' },
  { href: '/mypage/seller', label: '판매 상품', icon: '🏷️' },
  { href: '/mypage/seller/orders', label: '판매 주문', icon: '📋' },
];

interface MypageLayoutProps {
  children: React.ReactNode;
}

export default function MypageLayout({ children }: MypageLayoutProps) {
  const pathname = usePathname();

  /** 현재 탭 활성 여부 판별 */
  const isActive = (href: string) => {
    if (href === '/mypage') return pathname === '/mypage';
    if (href === '/mypage/seller') {
      return pathname === '/mypage/seller' || pathname?.startsWith('/mypage/seller/register') || pathname?.startsWith('/mypage/seller/') && !pathname?.includes('/orders');
    }
    return pathname?.startsWith(href) ?? false;
  };

  /** 현재 활성 탭의 라벨 가져오기 */
  const activeTab = MYPAGE_TABS.find((tab) => isActive(tab.href));
  const pageTitle = activeTab ? `${activeTab.icon} ${activeTab.label}` : '마이페이지';

  return (
    <div className="page">
      <div className="page-header">
        <p className="breadcrumb">
          <Link href="/">홈</Link> › 마이페이지{activeTab && activeTab.href !== '/mypage' ? ` › ${activeTab.label}` : ''}
        </p>
        <h1 className="page-title">{pageTitle}</h1>
      </div>

      {/* 탭 네비게이션 */}
      <nav className={styles.tabs}>
        {MYPAGE_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive(tab.href) ? styles.tabActive : ''}`}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* 페이지 컨텐츠 */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
