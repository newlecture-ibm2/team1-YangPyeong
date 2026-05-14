'use client';

import Link from 'next/link';
import styles from './PolicyRecommendGuideBanner.module.css';

interface PolicyRecommendGuideBannerProps {
  userRole: string | null;
  farmCount?: number;
  variant?: 'page' | 'inline'; // page: 전체 화면 엠프티 스테이트, inline: 다른 컨텐츠와 함께 렌더링
}

export default function PolicyRecommendGuideBanner({
  userRole,
  farmCount = 0,
  variant = 'page',
}: PolicyRecommendGuideBannerProps) {
  const isFarmer = userRole === 'FARMER';

  // 농업인이면서 등록된 농장이 1개 이상이면 배너를 숨김
  if (isFarmer && farmCount > 0) {
    return null;
  }

  const containerClass = variant === 'page' ? styles.pageVariant : styles.inlineVariant;

  return (
    <div className={`${styles.container} ${containerClass}`}>
      <span className={styles.icon}>🌱</span>
      
      {!isFarmer ? (
        // 1. 일반 회원 로직: 기능 안내 및 농장 등록 유도
        <>
          <h2 className={styles.title}>맞춤 정책 추천은 농업인 대상 기능입니다</h2>
          <p className={styles.description}>
            농장을 등록하고 농업인 정보를 설정해 보세요.<br />
            등록된 지역·작물·재배 정보 등을 바탕으로 나에게 맞는 지원사업과 정책 혜택을 추천해 드립니다.
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/farm/register" className={styles.actionButton}>내 농장 등록하기</Link>
            <Link href="/policy" className={styles.secondaryButton}>전체 정책 보기</Link>
          </div>
        </>
      ) : (
        // 2. 농업인 + 농장 0개 로직: 정보 등록 강조
        <>
          <h2 className={styles.title}>나만의 맞춤 정책을 추천받으려면?</h2>
          <p className={styles.description}>
            아직 등록된 농장 정보가 없습니다.<br />
            농장 정보를 등록하시면 지역, 면적, 토양 정보 등을 바탕으로 가장 적합한 지원사업과 보조금을 찾아드립니다!
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/farm/register" className={styles.actionButton}>농장 등록하고 추천받기</Link>
            <Link href="/policy" className={styles.secondaryButton}>전체 정책 보기</Link>
          </div>
        </>
      )}
    </div>
  );
}
