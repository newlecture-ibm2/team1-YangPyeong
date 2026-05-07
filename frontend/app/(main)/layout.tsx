import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FarmBot from '@/components/common/FarmBot/FarmBot';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <FarmBot>
        <main>
          {children}
        </main>
      </FarmBot>
      <Footer />
    </>
  );
}
