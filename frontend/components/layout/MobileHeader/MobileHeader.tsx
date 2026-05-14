'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, Bell, ShoppingCart } from 'lucide-react';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';
import { useHeaderData } from '@/lib/hooks/useHeaderData';
import styles from './MobileHeader.module.css';

export default function MobileHeader() {
  const router = useRouter();
  const { user, cartCount, unreadCount } = useHeaderData();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCartClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/shop/cart');
  };

  const handleNotifClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/mypage/notifications');
  };

  const displayName = user?.email ? user.email.split('@')[0] : '';

  return (
    <>
      <header className={styles.header}>
        {/* 좌: 햄버거 */}
        <button
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="메뉴 열기"
          type="button"
        >
          <Menu size={24} />
        </button>

        {/* 중: 로고 (탭하면 홈) */}
        <Link href="/" className={styles.logo} aria-label="홈으로">
          <Image src="/logo.png" alt="FarmBalance 로고" width={32} height={32} priority />
          <span className={styles.logoText}>FarmBalance</span>
        </Link>

        {/* 우: 알림 / 장바구니 / 아바타 */}
        <div className={styles.right}>
          <button
            className={styles.iconBtn}
            onClick={handleNotifClick}
            aria-label="알림"
            type="button"
          >
            <Bell size={22} />
            {user && unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          <button
            className={styles.iconBtn}
            onClick={handleCartClick}
            aria-label="장바구니"
            type="button"
          >
            <ShoppingCart size={22} />
            {user && cartCount > 0 && (
              <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </button>

          {user ? (
            <Link
              href="/mypage"
              className={styles.avatarBtn}
              aria-label="마이페이지"
            >
              {user.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt="프로필"
                  width={32}
                  height={32}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarFallback}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              로그인
            </Link>
          )}
        </div>
      </header>

      <HamburgerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        unreadCount={unreadCount}
        cartCount={cartCount}
      />
    </>
  );
}
