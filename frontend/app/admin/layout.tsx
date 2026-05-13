import { ReactNode } from 'react'
import Link from 'next/link'
import styles from './AdminLayout.module.css'
import Button from '@/components/common/Button/Button'
import AdminLogoutButton from './_components/AdminLogoutButton'

interface AdminLayoutProps {
  children: ReactNode
}

const ADMIN_MENUS = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/users', label: '유저 관리', icon: '👥' },
  { href: '/admin/farms', label: '농장 승인 관리', icon: '🏡' },
  { href: '/admin/community', label: '커뮤니티 관리', icon: '💬' },
  { href: '/admin/shop', label: '상점 상품 관리', icon: '🛒' },
  { href: '/admin/orders', label: '주문 관리', icon: '📦' },
  { href: '/admin/crops', label: '작물 동기화 관리', icon: '🌾' },
  { href: '/admin/policy', label: '정책 관리', icon: '📄' },
  { href: '/admin/rag', label: 'AI RAG 관리', icon: '🤖' },
  { href: '/admin/data', label: '외부 데이터 연동 관리', icon: '🔌' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>FarmBalance<br/><span>Admin</span></h2>
        </div>
        
        <nav className={styles.navMenu}>
          <div className={styles.menuTitle}>관리 메뉴</div>
          {ADMIN_MENUS.map(menu => (
            <Link key={menu.href} href={menu.href} className={styles.navItem}>
              <span className={styles.navIcon}>{menu.icon}</span>
              {menu.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/">
            <Button variant="outline" style={{ width: '100%' }}>
              ← 일반 페이지로 돌아가기
            </Button>
          </Link>
          <AdminLogoutButton />
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
