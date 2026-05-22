'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingCart, Shield, LogOut, User } from 'lucide-react';
import { useHeaderContext } from '../HeaderProvider';
import styles from './MobileHeader.module.css';

export default function MobileHeader() {
  const router = useRouter();
  const { user, cartCount, unreadCount, handleLogout } = useHeaderContext();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const displayName = user?.email ? user.email.split('@')[0] : '';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCartClick = () => {
    if (!user) { router.push('/login'); return; }
    router.push('/shop/cart');
  };

  const handleNotifClick = () => {
    if (!user) { router.push('/login'); return; }
    router.push('/mypage/notifications');
  };

  const onLogoutClick = async () => {
    setAvatarOpen(false);
    await handleLogout();
  };

  return (
    <header className={styles.header}>
      {/* 좌: 로고 */}
      <Link href="/" className={styles.logo} aria-label="홈으로">
        <Image src="/logo.png" alt="FarmBalance 로고" width={32} height={32} priority />
        <span className={styles.logoText}>FarmBalance</span>
      </Link>

      {/* 우: 알림 / 장바구니 / 아바타 드롭다운 */}
      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={handleNotifClick} aria-label="알림" type="button">
          <Bell size={22} />
          {user && unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        <button className={styles.iconBtn} onClick={handleCartClick} aria-label="장바구니" type="button">
          <ShoppingCart size={22} />
          {user && cartCount > 0 && (
            <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </button>

        {user ? (
          <div className={styles.avatarArea} ref={avatarRef}>
            <button
              className={styles.avatarBtn}
              onClick={() => setAvatarOpen(o => !o)}
              aria-label="프로필 메뉴"
              type="button"
            >
              {user.profileImageUrl ? (
                <Image src={user.profileImageUrl} alt="프로필" width={32} height={32} className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarFallback}>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </button>

            {avatarOpen && (
              <div className={styles.avatarDropdown}>
                <div className={styles.dropdownProfile}>
                  <span className={styles.dropdownName}>{displayName}</span>
                  <span className={styles.dropdownRole}>{user.role}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <Link href="/mypage" className={styles.dropdownItem} onClick={() => setAvatarOpen(false)}>
                  <User size={16} /> 마이페이지
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={styles.dropdownItem} onClick={() => setAvatarOpen(false)}>
                    <Shield size={16} /> 관리자
                  </Link>
                )}
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={onLogoutClick} type="button">
                  <LogOut size={16} /> 로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={styles.loginBtn}>로그인</Link>
        )}
      </div>
    </header>
  );
}
