'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';
import HeaderProvider from '@/components/layout/HeaderProvider';
import FarmBot from '@/components/common/FarmBot/FarmBot';

interface MainLayoutShellProps {
  children: ReactNode;
}

export default function MainLayoutShell({ children }: MainLayoutShellProps) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <HeaderProvider>
      <Header />
      <MobileHeader />
      <FarmBot>
        <main>{children}</main>
      </FarmBot>
      <Footer />
      <MobileNav />
    </HeaderProvider>
  );
}
