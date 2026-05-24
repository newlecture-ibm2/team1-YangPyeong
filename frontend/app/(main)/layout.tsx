import { ReactNode } from 'react';
import MainLayoutShell from './MainLayoutShell';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <MainLayoutShell>{children}</MainLayoutShell>;
}
