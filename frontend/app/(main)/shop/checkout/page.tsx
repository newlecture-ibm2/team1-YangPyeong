'use client';

import { Suspense, useEffect } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useCheckout } from './useCheckout';
import Dropdown from '@/components/common/Dropdown';
import {
  FREE_SHIPPING_THRESHOLD,
  DELIVERY_MEMO_OPTIONS,
} from '@/lib/constants';
import styles from './page.module.css';

/** 가격 포맷 */
function formatPrice(price: number): string {
  return `₩${price.toLocaleString()}`;
}

/** 주문/결제 페이지 (Suspense 래퍼) */
export default function CheckoutPage() {
  return (
    <>
      {/* 다음(카카오) 우편번호 검색 API 스크립트 */}
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <Suspense fallback={<div className={styles.page}>로딩 중...</div>}>
        <CheckoutContent />
      </Suspense>
    </>
  );
}

/** 모바일에서 PortOne 결제 iframe이 viewport를 벗어나지 않도록 강제 조정 */
function usePortOneMobileFix() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return;

    const applyFix = (el: Element) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);
      if (style.position !== 'fixed') return;

      const iframe = htmlEl.querySelector('iframe');
      if (!iframe) return;

      htmlEl.style.overflow = 'hidden';
      htmlEl.style.maxWidth = '100vw';
      iframe.style.maxWidth = '100vw';
      iframe.style.width = '100vw';
      iframe.style.left = '0';
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          applyFix(node as Element);
        }
      }
    });

    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);
}

/** 주문/결제 콘텐츠 */
function CheckoutContent() {
  usePortOneMobileFix();

  const {
    orderItems,
    shippingForm,
    updateShipping,
    paymentMethod,
    setPaymentMethod,
    productTotal,
    deliveryFee,
    finalTotal,
    handlePayment,
    isFormValid,
    isProcessing,
    paymentError,
    errors,
    touched,
    handleBlur,
    openDaumPostcode,
    saveAsDefault,
    setSaveAsDefault,
  } = useCheckout();

  /** 직접 입력 메모인지 체크 */
  const isCustomMemo = shippingForm.deliveryMemo === '직접 입력';

  /** 에러 보여줄지 여부 (touched 된 필드에만 표시) */
  const showError = (field: 'receiverName' | 'receiverPhone' | 'address') =>
    touched[field] && errors[field];

  return (
    <div className={styles.page}>
      {/* ════════ 브레드크럼 ════════ */}
      <nav className={styles.breadcrumb}>
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/shop">상점</Link>
        <span>›</span>
        <Link href="/shop/cart">장바구니</Link>
        <span>›</span>
        <strong>주문/결제</strong>
      </nav>

      {/* ════════ 페이지 헤더 ════════ */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>주문/결제</h1>
        <p className={styles.pageSub}>
          배송 정보와 결제 수단을 확인한 후 결제를 진행해 주세요.
        </p>
      </div>

      {/* ════════ 2컬럼 레이아웃 ════════ */}
      <div className={styles.checkoutLayout}>
        {/* ── 좌측: 폼 영역 ── */}
        <div className={styles.formSection}>

          {/* ━━━━━━ 1. 배송 정보 ━━━━━━ */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📦</span>
              배송 정보
            </h2>

            <div className={styles.formGrid}>
              {/* 받는 분 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>받는 분 <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.formInput} ${showError('receiverName') ? styles.formInputError : ''}`}
                  placeholder="이름을 입력하세요"
                  value={shippingForm.receiverName}
                  onChange={(e) => updateShipping('receiverName', e.target.value)}
                  onBlur={() => handleBlur('receiverName')}
                />
                {showError('receiverName') && (
                  <span className={styles.errorMessage}>{errors.receiverName}</span>
                )}
              </div>

              {/* 연락처 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>연락처 <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.formInput} ${showError('receiverPhone') ? styles.formInputError : ''}`}
                  placeholder="010-0000-0000"
                  value={shippingForm.receiverPhone}
                  onChange={(e) => updateShipping('receiverPhone', e.target.value)}
                  onBlur={() => handleBlur('receiverPhone')}
                />
                {showError('receiverPhone') && (
                  <span className={styles.errorMessage}>{errors.receiverPhone}</span>
                )}
              </div>

              {/* 배송지 */}
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>배송지 <span className={styles.required}>*</span></label>
                <div className={styles.addressRow}>
                  <input
                    className={`${styles.formInput} ${styles.postcodeInput} ${styles.formInputReadonly}`}
                    value={shippingForm.postcode}
                    placeholder="우편번호"
                    readOnly
                  />
                  <button
                    className={styles.addressSearchBtn}
                    onClick={openDaumPostcode}
                    type="button"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  className={`${styles.formInput} ${showError('address') ? styles.formInputError : ''}`}
                  value={shippingForm.address}
                  placeholder="주소를 검색해 주세요"
                  readOnly
                />
                {showError('address') && (
                  <span className={styles.errorMessage}>{errors.address}</span>
                )}
                <input
                  className={`${styles.formInput} ${styles.addressDetailInput}`}
                  placeholder="상세 주소를 입력하세요"
                  value={shippingForm.addressDetail}
                  onChange={(e) => updateShipping('addressDetail', e.target.value)}
                />
              </div>

              {/* 배송 메모 */}
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>배송 메모</label>
                <Dropdown
                  options={DELIVERY_MEMO_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                  value={shippingForm.deliveryMemo}
                  onChange={(val) => updateShipping('deliveryMemo', val)}
                  fullWidth
                />
                {isCustomMemo && (
                  <input
                    className={`${styles.formInput} ${styles.addressDetailInput}`}
                    placeholder="배송 메모를 직접 입력해 주세요"
                    value={shippingForm.customMemo}
                    onChange={(e) => updateShipping('customMemo', e.target.value)}
                  />
                )}
              </div>

              {/* 기본 배송지로 저장 */}
              <div className={styles.formGroupFull}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                  />
                  <span className={styles.checkboxText}>이 주소를 기본 배송지로 저장</span>
                </label>
              </div>
            </div>
          </div>

          {/* ━━━━━━ 2. 결제 수단 ━━━━━━ */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💳</span>
              결제 수단
            </h2>
            <div className={styles.paymentMethods}>
              <button
                className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.paymentBtnActive : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className={styles.paymentIcon}>💳</span>
                카드 결제
              </button>
              <button
                className={`${styles.paymentBtn} ${paymentMethod === 'bank' ? styles.paymentBtnActive : ''}`}
                onClick={() => setPaymentMethod('bank')}
              >
                <span className={styles.paymentIcon}>🏦</span>
                무통장 입금
              </button>
            </div>
          </div>

        </div>

        {/* ── 우측: 주문 요약 ── */}
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>주문 요약</h2>

          {/* 주문 상품 미니 목록 */}
          <div className={styles.orderItemList}>
            {orderItems.map((item) => (
              <div key={item.id} className={styles.orderItemRow}>
                <span className={styles.orderItemName}>
                  {item.product.name}
                </span>
                <span className={styles.orderItemQty}>
                  x{item.quantity}
                </span>
                <span className={styles.orderItemPrice}>
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* 금액 정보 */}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>상품 금액</span>
            <span className={styles.summaryValue}>
              {formatPrice(productTotal)}
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>배송비</span>
            <span className={deliveryFee === 0 ? styles.summaryValueFree : styles.summaryValue}>
              {deliveryFee === 0 ? '무료' : formatPrice(deliveryFee)}
            </span>
          </div>

          {deliveryFee > 0 && (
            <div className={styles.freeShippingNote}>
              🚚 {formatPrice(FREE_SHIPPING_THRESHOLD - productTotal)} 더 담으면 무료배송!
            </div>
          )}

          <div className={styles.summaryDivider} />

          <div className={styles.summaryTotalRow}>
            <span className={styles.summaryTotalLabel}>결제 금액</span>
            <span className={styles.summaryTotalValue}>
              {formatPrice(finalTotal)}
            </span>
          </div>

          {/* 결제 에러 메시지 */}
          {paymentError && (
            <div className={styles.payError}>
              ⚠️ {paymentError}
            </div>
          )}

          {/* 결제 버튼 */}
          <button
            className={styles.payBtn}
            disabled={!isFormValid || isProcessing}
            onClick={handlePayment}
          >
            {isProcessing
              ? '결제 처리 중...'
              : isFormValid
                ? `${formatPrice(finalTotal)} 결제하기`
                : '배송 정보를 입력해 주세요'}
          </button>

          <Link href="/shop/cart" className={styles.backLink}>
            ← 장바구니로 돌아가기
          </Link>

          <p className={styles.payNotice}>
            위 주문 내용을 확인하였으며, 결제에 동의합니다.
            <br />
            (전자상거래법 제8조 2항)
          </p>
        </div>
      </div>
    </div>
  );
}
