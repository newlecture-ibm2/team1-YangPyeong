'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/balance', label: '밸런스' },
  { href: '/recommend', label: 'AI 추천' },
  { href: '/community', label: '커뮤니티' },
  { href: '/policy', label: '정책' },
  { href: '/shop', label: '상점' },
  { href: '/stores', label: '가게' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // TODO: 실제 인증 상태로 교체 (개발 중 임시 true 처리)
  const isLoggedIn = true; // ← 로그인 구현 후 false로 복원

  /** 장바구니 클릭 — 로그인 체크 후 이동 */
  const handleCartClick = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    router.push('/shop/cart');
  };

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
        {/* 장바구니 버튼 (로그인 체크) */}
        <button
          className={styles.cartBtn}
          onClick={handleCartClick}
          aria-label="장바구니"
          type="button"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </button>

        {isLoggedIn ? (
          <>
            <Link href="/mypage" className={styles.btnOutline}>
              마이페이지
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.btnOutline}>
              로그인
            </Link>
            <Link href="/signup" className={styles.btnFill}>
              시작하기
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
