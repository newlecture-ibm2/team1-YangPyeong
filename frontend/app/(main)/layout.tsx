import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';
import HeaderProvider from '@/components/layout/HeaderProvider';
import FarmBot from '@/components/common/FarmBot/FarmBot';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <HeaderProvider>
      <Header />
      <MobileHeader />
      <FarmBot>
        <main>
          {children}
        </main>
      </FarmBot>
      <Footer />
      <MobileNav />
    </HeaderProvider>
  );
}
