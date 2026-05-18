'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout, ShoppingBag, MessageCircle, MapPin, FileText } from 'lucide-react';
import styles from './MobileNav.module.css';

const TABS = [
  { href: '/farm',      label: '내농장',    Icon: Sprout },
  { href: '/shop',      label: '장터',      Icon: ShoppingBag },
  { href: '/community', label: '수다방',    Icon: MessageCircle },
  { href: '/stores',    label: '동네구경',  Icon: MapPin },
  { href: '/policy',    label: '정책',      Icon: FileText },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabbar} aria-label="모바일 메인 네비게이션">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname?.startsWith(href) ?? false;
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} className={styles.icon} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
