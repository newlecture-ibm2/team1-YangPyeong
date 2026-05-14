'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { X, Bell, ShoppingCart, User, LogOut, LogIn, UserPlus, Shield } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';
import styles from './HamburgerMenu.module.css';

interface HamburgerUser {
  email: string;
  role: string;
  profileImageUrl?: string | null;
}

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
  user: HamburgerUser | null;
  unreadCount: number;
  cartCount: number;
}

export default function HamburgerMenu({ open, onClose, user, unreadCount, cartCount }: HamburgerMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  // 경로 변경 시 자동으로 닫기 (첫 마운트 제외)
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
    // onClose는 의도적으로 deps에서 제외 (매 렌더 새로 생성되는 인라인 함수)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 열려있을 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleLogout = async () => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('fcm-token') : null;
      if (savedToken) {
        await fetch('/api/fcm/tokens', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: savedToken }),
        }).catch(() => {});
        localStorage.removeItem('fcm-token');
      }
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('auth-changed'));
      onClose();
      router.push('/');
      router.refresh();
    }
  };

  const displayName = user?.email ? user.email.split('@')[0] : '';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'GOV';

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 */}
      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-label="메뉴"
        aria-hidden={!open}
      >
        {/* 헤더: 닫기 버튼 */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>메뉴</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="메뉴 닫기" type="button">
            <X size={22} />
          </button>
        </div>

        {/* 프로필 영역 */}
        {user ? (
          <Link href="/mypage" className={styles.profileCard} onClick={onClose}>
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt="프로필"
                width={48}
                height={48}
                className={styles.avatar}
              />
            ) : (
              <span className={styles.avatarFallback}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className={styles.profileText}>
              <span className={styles.profileName}>{displayName}</span>
              <span className={styles.profileRole}>{user.role}</span>
            </span>
          </Link>
        ) : (
          <div className={styles.authButtons}>
            <Link href="/login" className={styles.btnOutline} onClick={onClose}>
              <LogIn size={16} /> 로그인
            </Link>
            <Link href="/signup" className={styles.btnFill} onClick={onClose}>
              <UserPlus size={16} /> 회원가입
            </Link>
          </div>
        )}

        <div className={styles.divider} />

        {/* 보조 진입점 */}
        {user && (
          <nav className={styles.menuList}>
            <Link href="/mypage" className={styles.menuItem} onClick={onClose}>
              <User size={18} />
              <span className={styles.menuLabel}>마이페이지</span>
            </Link>
            <Link href="/mypage/notifications" className={styles.menuItem} onClick={onClose}>
              <Bell size={18} />
              <span className={styles.menuLabel}>알림</span>
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </Link>
            <Link href="/shop/cart" className={styles.menuItem} onClick={onClose}>
              <ShoppingCart size={18} />
              <span className={styles.menuLabel}>장바구니</span>
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>

            {isAdmin && (
              <>
                <div className={styles.menuDivider} />
                <Link href="/admin" className={styles.menuItem} onClick={onClose}>
                  <Shield size={18} />
                  <span className={styles.menuLabel}>관리자</span>
                </Link>
              </>
            )}

            <div className={styles.menuDivider} />
            <button className={styles.menuItem} onClick={handleLogout} type="button">
              <LogOut size={18} />
              <span className={styles.menuLabel}>로그아웃</span>
            </button>
          </nav>
        )}
      </aside>
    </>
  );
}
