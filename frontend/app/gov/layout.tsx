import { ReactNode } from 'react';
import GovNav from '@/components/layout/GovNav/GovNav';
import styles from './gov.module.css';

interface GovLayoutProps {
  children: ReactNode;
}

export default function GovLayout({ children }: GovLayoutProps) {
  return (
    <>
      <GovNav />
      {children}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>FarmBalance</div>
        <p className={styles.footerCopy}>© 2026 FarmBalance. 지자체 스마트 파밍 플랫폼</p>
      </footer>
    </>
  );
}
