'use client';

import React, { ReactNode } from 'react';
import GuestPreviewBanner from '../GuestPreviewBanner/GuestPreviewBanner';
import styles from './MockupOverlay.module.css';

interface MockupOverlayProps {
  hasUnapprovedFarms?: boolean;
  children?: ReactNode;
}

/**
 * 미리보기 오버레이 컴포넌트
 *
 * 사용 방식 2가지:
 * 1. children을 감싸는 래퍼 — 콘텐츠를 블러 처리하고 중앙에 안내 배너를 띄움
 *    <MockupOverlay hasUnapprovedFarms={...}>
 *      <div>콘텐츠</div>
 *    </MockupOverlay>
 *
 * 2. 단독 오버레이 — 부모(position:relative)의 영역을 덮는 absolute 레이어
 *    <MockupOverlay hasUnapprovedFarms={...} />
 */
export default function MockupOverlay({
  hasUnapprovedFarms = false,
  children,
}: MockupOverlayProps) {
  // 1. children이 있는 경우: 콘텐츠를 블러 처리 + 중앙 배너
  if (children) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.blurContent}>{children}</div>
        <div className={styles.bannerContainer}>
          <GuestPreviewBanner hasUnapprovedFarms={hasUnapprovedFarms} />
        </div>
      </div>
    );
  }

  // 2. children이 없는 경우: 부모 영역을 덮는 absolute 오버레이
  return (
    <div className={styles.absoluteOverlay}>
      <div className={styles.bannerContainerAbsolute}>
        <GuestPreviewBanner hasUnapprovedFarms={hasUnapprovedFarms} />
      </div>
    </div>
  );
}
