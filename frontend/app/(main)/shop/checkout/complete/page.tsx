'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './page.module.css';

/** 가격 포맷 */
function formatPrice(price: number): string {
  return `${price.toLocaleString()}원`;
}

/** 배송 타임라인 단계 */
const TIMELINE_STEPS = [
  { label: '주문접수', icon: '📋' },
  { label: '상품준비', icon: '📦' },
  { label: '배송완료', icon: '🚚' },
];

/** 결제 완료 페이지 콘텐츠 */
function CompleteContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '-';

  const orderInfo = {
    paymentId,
    orderNumber: paymentId.replace('payment-', '').slice(0, 8).toUpperCase(),
    orderName: searchParams.get('orderName') || '주문 상품',
    totalAmount: Number(searchParams.get('totalAmount')) || 0,
    paymentMethod: searchParams.get('payMethod') || '카드 결제',
    orderDate: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* 성공 아이콘 */}
        <div className={styles.iconArea}>
          <div className={styles.iconGlow} />
          <div className={styles.successIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>결제가 완료되었습니다!</h1>
        <p className={styles.subtitle}>
          주문이 정상적으로 접수되었습니다.
          <br />
          빠른 시일 내에 신선한 농산물을 보내드리겠습니다 🌿
        </p>

        {/* 배송 타임라인 */}
        <div className={styles.timeline}>
          {TIMELINE_STEPS.map((step, idx) => (
            <div key={step.label} className={styles.timelineStep}>
              <div className={`${styles.timelineDot} ${idx === 0 ? styles.timelineDotActive : ''}`}>
                {idx === 0 ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className={styles.timelineNumber}>{idx + 1}</span>
                )}
              </div>
              <span className={`${styles.timelineLabel} ${idx === 0 ? styles.timelineLabelActive : ''}`}>
                {step.label}
              </span>
              {idx < TIMELINE_STEPS.length - 1 && <div className={styles.timelineLine} />}
            </div>
          ))}
        </div>

        {/* 주문 정보 카드 */}
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>주문 번호</span>
            <span className={styles.infoValue}>{orderInfo.orderNumber}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>주문 내용</span>
            <span className={styles.infoValue}>{orderInfo.orderName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>결제 수단</span>
            <span className={styles.infoValue}>{orderInfo.paymentMethod}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>주문 일시</span>
            <span className={styles.infoValue}>{orderInfo.orderDate}</span>
          </div>
          <div className={`${styles.infoRow} ${styles.infoRowTotal}`}>
            <span className={styles.infoLabel}>결제 금액</span>
            <span className={styles.totalValue}>
              {formatPrice(orderInfo.totalAmount)}
            </span>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className={styles.actions}>
          <Link href="/mypage/history" className={styles.primaryBtn}>
            📋 주문내역 보기
          </Link>
          <Link href="/shop" className={styles.secondaryBtn}>
            🛍️ 쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 결제 완료 페이지 (Suspense 래핑 — useSearchParams 사용) */
export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px' }}>로딩 중...</div>}>
      <CompleteContent />
    </Suspense>
  );
}
