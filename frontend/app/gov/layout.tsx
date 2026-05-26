import { ReactNode } from 'react';
import GovNav from '@/components/layout/GovNav/GovNav';
import { GovChatProvider } from './_components/GovChatProvider';
import GovFloatingChat from './_components/GovFloatingChat/GovFloatingChat';
import LandingFooter from '@/components/layout/LandingFooter';

interface GovLayoutProps {
  children: ReactNode;
}

export default function GovLayout({ children }: GovLayoutProps) {
  return (
    <GovChatProvider>
      <GovNav />
      {children}
      <LandingFooter />
      <GovFloatingChat />
    </GovChatProvider>
  );
}
