'use client';

import { useState } from 'react';
import Link from 'next/link';
import LegalModal from '@/components/common/LegalModal/LegalModal';
import styles from './LandingFooter.module.css';

type LegalType = 'terms' | 'privacy';

export default function LandingFooter() {
  const [openModal, setOpenModal] = useState<LegalType | null>(null);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Link className={styles.footerLogo} href="/">
              <img src="/logo.png" alt="FarmBalance" width={28} height={28} />
              <span>FarmBalance</span>
            </Link>
            <p className={styles.footerCopy}>© 2026 FarmBalance. 양평군 스마트 농업 플랫폼</p>
          </div>
          <div className={styles.footerRight}>
            <button type="button" className={styles.footerLink} onClick={() => setOpenModal('terms')}>
              이용약관
            </button>
            <button type="button" className={styles.footerLink} onClick={() => setOpenModal('privacy')}>
              개인정보처리방침
            </button>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={openModal !== null}
        onClose={() => setOpenModal(null)}
        type={openModal ?? 'terms'}
      />
    </>
  );
}
