'use client';

import Link from 'next/link';
import styles from './GuestPreviewBanner.module.css';

interface GuestPreviewBannerProps {
  message?: string;
  hasUnapprovedFarms?: boolean;
  isGuest?: boolean;
}

/**
 * 비회원/일반 유저에게 노출되는 미리보기 안내 배너
 */
export default function GuestPreviewBanner({ 
  message,
  hasUnapprovedFarms = false,
  isGuest = false
}: GuestPreviewBannerProps) {
  let defaultMessage = "현재 보시는 화면은 샘플 데이터가 적용된 미리보기입니다. 내 농장을 등록하시면 맞춤 분석을 받아보실 수 있습니다.";
  if (isGuest) {
    defaultMessage = "로그인이 필요한 기능입니다. 회원가입 후 나만의 농장을 관리해보세요!";
  } else if (hasUnapprovedFarms) {
    defaultMessage = "현재 농장 등록 심사가 진행 중입니다. 심사 완료 후 실제 데이터를 관리할 수 있습니다.";
  }
  
  const displayMessage = message || defaultMessage;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>💡</span>
        <p className={styles.message}>{displayMessage}</p>
      </div>
      <div className={styles.actions}>
        {isGuest ? (
          <Link href="/login?callbackUrl=/farm" className={styles.link}>
            로그인 / 회원가입 하러 가기 →
          </Link>
        ) : hasUnapprovedFarms ? (
          <Link href="/mypage/farm-applications" className={styles.link}>
            심사 현황 확인하기 →
          </Link>
        ) : (
          <Link href="/farm/register" className={styles.link}>
            내 농장 등록하기 →
          </Link>
        )}
      </div>
    </div>
  );
}
