import { ReactNode } from 'react';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
