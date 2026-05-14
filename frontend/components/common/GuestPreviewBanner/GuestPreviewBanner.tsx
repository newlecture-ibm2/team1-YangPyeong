'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './GuestPreviewBanner.module.css';

interface GuestPreviewBannerProps {
  message?: string;
}

/**
 * 비회원/일반 유저에게 노출되는 미리보기 안내 배너
 */
export default function GuestPreviewBanner({ 
  message = "해당 페이지는 농업인들을 위한 페이지로 임시로 제공되는 가짜 데이터입니다. 정확한 데이터를 위하여 농업인 인증해주세요." 
}: GuestPreviewBannerProps) {
  const [isFarmer, setIsFarmer] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const match = document.cookie.match(/(?:^|;\s*)fb-user=([^;]*)/);
    if (match) {
      try {
        const user = JSON.parse(decodeURIComponent(match[1]));
        if (user && user.role === 'FARMER') {
          setIsFarmer(true);
        }
      } catch (e) {}
    }
  }, []);

  if (!isClient || isFarmer) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>💡</span>
        <p className={styles.message}>{message}</p>
      </div>
      <div className={styles.actions}>
        <Link href="/signup?type=farmer" className={styles.link}>
          지금 농업인 인증하기 →
        </Link>
      </div>
    </div>
  );
}
