'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import MobileNav from '@/components/layout/MobileNav';
import HeaderProvider from '@/components/layout/HeaderProvider';
import FarmBot from '@/components/common/FarmBot/FarmBot';
import styles from './MainLayoutShell.module.css';

interface MainLayoutShellProps {
  children: ReactNode;
}

export default function MainLayoutShell({ children }: MainLayoutShellProps) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <HeaderProvider>
      <LandingHeader />
      <FarmBot>
        <main className={isLanding ? styles.main : styles.mainWithOffset}>{children}</main>
      </FarmBot>
      <LandingFooter />
      <MobileNav />
    </HeaderProvider>
  );
}
