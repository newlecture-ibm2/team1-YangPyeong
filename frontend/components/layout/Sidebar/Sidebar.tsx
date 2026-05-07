'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export interface SidebarMenuItem {
  href: string;
  label: string;
  icon: string;
}

export interface SidebarMenuGroup {
  title?: string;
  items: SidebarMenuItem[];
}

interface SidebarProps {
  title: string;
  groups: SidebarMenuGroup[];
  className?: string;
}

export default function Sidebar({ title, groups, className = '' }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <p className={styles.sidebarTitle}>{title}</p>

      <ul className={styles.menu}>
        {groups.map((group, gi) => (
          <li key={gi}>
            {group.title && (
              <p className={styles.menuLabel}>{group.title}</p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.menuLink} ${pathname === item.href ? styles['menuLink--active'] : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </li>
        ))}
      </ul>
    </aside>
  );
}
