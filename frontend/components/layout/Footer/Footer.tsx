'use client';

import { useState } from 'react';
import Image from 'next/image';
import LegalModal from '@/components/common/LegalModal/LegalModal';
import styles from './Footer.module.css';

type LegalType = 'terms' | 'privacy';

export default function Footer() {
  const [openModal, setOpenModal] = useState<LegalType | null>(null);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.brand}>
          <Image src="/logo.png" alt="FarmBalance 로고" width={64} height={64} />
          <span>FarmBalance</span>
        </div>

        <div className={styles.links}>
          <button className={styles.link} onClick={() => setOpenModal('terms')}>
            이용약관
          </button>
          <button className={styles.link} onClick={() => setOpenModal('privacy')}>
            개인정보처리방침
          </button>
        </div>

        <div className={styles.copy}>
          © 2026 FarmBalance. All rights reserved.
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
