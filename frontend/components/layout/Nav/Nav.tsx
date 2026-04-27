'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { href: '/balance', label: '밸런스' },
  { href: '/recommend', label: 'AI 추천' },
  { href: '/community', label: '커뮤니티' },
  { href: '/shop', label: '상점' },
];

export default function Nav() {
  const pathname = usePathname();

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
        <Link href="/login" className={styles.btnOutline}>
          로그인
        </Link>
        <Link href="/signup" className={styles.btnFill}>
          시작하기
        </Link>
      </div>
    </nav>
  );
}
