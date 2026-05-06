'use client';

import Image from 'next/image';
import styles from './AuthBrand.module.css';

/**
 * 인증 페이지 공통 브랜드 영역 (로고 + 서브 타이틀)
 */
export default function AuthBrand() {
  return (
    <>
      <div className={styles.logoArea}>
        <Image src="/logo.png" alt="FarmBalance 로고" width={80} height={80} />
        <span className={styles.logoText}>Farm<em>Balance</em></span>
      </div>
      <p className={styles.authSub}>양평군 스마트 파밍 플랫폼</p>
    </>
  );
}
