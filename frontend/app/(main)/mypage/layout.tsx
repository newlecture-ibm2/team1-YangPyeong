'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

const SIDEBAR_GROUPS = [
  {
    label: '내 정보',
    items: [
      { href: '/mypage', label: '프로필', icon: '👤' },
      { href: '/mypage/notifications', label: '알림', icon: '🔔' },
    ],
  },
  {
    label: '내 활동',
    items: [
      { href: '/mypage/posts', label: '내 게시글', icon: '📝' },
      { href: '/mypage/comments', label: '내 댓글', icon: '💬' },
      { href: '/mypage/reports', label: '신고 내역', icon: '🚩' },
    ],
  },
  {
    label: '쇼핑',
    items: [
      { href: '/mypage/history', label: '주문내역', icon: '📦' },
    ],
  },
  {
    label: '판매자',
    items: [
      { href: '/mypage/seller', label: '판매 상품', icon: '🏷️' },
      { href: '/mypage/seller/orders', label: '판매 주문', icon: '📋' },
      { href: '/mypage/farm-applications', label: '농장 등록 현황', icon: '🌾' },
    ],
  },
];

interface MypageLayoutProps {
  children: React.ReactNode;
}

export default function MypageLayout({ children }: MypageLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/mypage') return pathname === '/mypage';
    if (href === '/mypage/seller') {
      return (
        pathname === '/mypage/seller' ||
        (pathname?.startsWith('/mypage/seller/') && !pathname?.includes('/orders'))
      );
    }
    return pathname?.startsWith(href) ?? false;
  };

  const activeItem = SIDEBAR_GROUPS.flatMap((g) => g.items).find((item) => isActive(item.href));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link href="/">홈</Link> › 마이페이지
            {activeItem && activeItem.href !== '/mypage' ? ` › ${activeItem.label}` : ''}
          </p>
          <h1 className="page-title">마이페이지</h1>
        </div>
      </div>

      <div className={styles.layout}>
        {/* 사이드바 */}
        <nav className={styles.sidebar}>
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.label} className={styles.group}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.item} ${isActive(item.href) ? styles.itemActive : ''}`}
                >
                  <span className={styles.itemIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* 컨텐츠 */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
