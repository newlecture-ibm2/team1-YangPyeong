'use client';

import Link from 'next/link';
import { useToast } from '@/components';
import { useCart } from './useCart';
import styles from './page.module.css';

/** 가격 포맷 */
function formatPrice(price: number): string {
  return `₩${price.toLocaleString()}`;
}

/** 장바구니 페이지 */
export default function CartPage() {
  const {
    items,
    selectedIds,
    isAllSelected,
    selectedCount,
    selectedTotalPrice,
    updateQuantity,
    removeItem,
    removeSelected,
    toggleSelect,
    toggleSelectAll,
    isEmpty,
  } = useCart();

  const { success: toastSuccess, info: toastInfo } = useToast();

  /** 선택 삭제 핸들러 */
  const handleRemoveSelected = () => {
    if (selectedCount === 0) {
      toastInfo('삭제할 상품을 선택해주세요.');
      return;
    }
    removeSelected();
    toastSuccess(`${selectedCount}개 상품을 삭제했습니다.`);
  };

  /** 주문하기 핸들러 */
  const handleCheckout = () => {
    if (selectedCount === 0) {
      toastInfo('주문할 상품을 선택해주세요.');
      return;
    }
    // TODO: checkout 페이지로 이동 + 선택 상품 전달
    toastSuccess('주문 페이지로 이동합니다.');
  };

  /** 배송비 (5만원 이상 무료) */
  const deliveryFee = selectedTotalPrice >= 50000 ? 0 : 3000;
  const finalTotal = selectedTotalPrice + deliveryFee;

  return (
    <div className={styles.page}>
      {/* ════════ 브레드크럼 ════════ */}
      <nav className={styles.breadcrumb}>
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/shop">상점</Link>
        <span>›</span>
        <strong>장바구니</strong>
      </nav>

      {/* ════════ 페이지 헤더 ════════ */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          장바구니 <em>({items.length})</em>
        </h1>
        <p className={styles.pageSub}>
          담아둔 상품을 확인하고 주문해 보세요.
        </p>
      </div>

      {/* ════════ 빈 장바구니 ════════ */}
      {isEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛒</div>
          <p className={styles.emptyText}>장바구니가 비어있습니다</p>
          <p className={styles.emptySub}>
            양평군의 신선한 농산물을 담아보세요!
          </p>
          <Link href="/shop" className={styles.emptyBtn}>
            🌿 상점 둘러보기
          </Link>
        </div>
      ) : (
        /* ════════ 2컬럼 레이아웃 ════════ */
        <div className={styles.cartLayout}>
          {/* ── 좌측: 장바구니 목록 ── */}
          <div className={styles.cartList}>
            {/* 전체 선택 바 */}
            <div className={styles.selectBar}>
              <button
                className={styles.selectAll}
                onClick={toggleSelectAll}
              >
                <span
                  className={`${styles.checkbox} ${
                    isAllSelected ? styles.checkboxChecked : ''
                  }`}
                >
                  ✓
                </span>
                전체 선택 ({selectedCount}/{items.length})
              </button>
              <button
                className={styles.deleteSelectedBtn}
                onClick={handleRemoveSelected}
              >
                선택 삭제
              </button>
            </div>

            {/* 아이템 목록 */}
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const subtotal = item.product.price * item.quantity;

              return (
                <div
                  key={item.id}
                  className={`${styles.cartItem} ${
                    isSelected ? styles.cartItemSelected : ''
                  }`}
                >
                  {/* 체크박스 */}
                  <button
                    className={styles.itemCheckbox}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <span
                      className={`${styles.checkbox} ${
                        isSelected ? styles.checkboxChecked : ''
                      }`}
                    >
                      ✓
                    </span>
                  </button>

                  {/* 상품 이미지 */}
                  <Link href={`/shop/${item.productId}`}>
                    <img
                      src={item.product.imageUrls[0]}
                      alt={item.product.name}
                      className={styles.itemImage}
                    />
                  </Link>

                  {/* 상품 정보 */}
                  <div className={styles.itemInfo}>
                    <Link
                      href={`/shop/${item.productId}`}
                      className={styles.itemName}
                    >
                      {item.product.name}
                    </Link>
                    <span className={styles.itemSeller}>
                      {item.product.sellerName}
                    </span>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.product.price)}
                    </span>
                  </div>

                  {/* 수량 조절 */}
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.product.stock}
                    >
                      +
                    </button>
                  </div>

                  {/* 소계 + 삭제 */}
                  <div className={styles.itemActions}>
                    <span className={styles.subtotal}>
                      {formatPrice(subtotal)}
                    </span>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => {
                        removeItem(item.id);
                        toastSuccess(
                          `${item.product.name}을(를) 삭제했습니다.`
                        );
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 우측: 주문 요약 ── */}
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>주문 요약</h2>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>
                선택 상품 ({selectedCount}개)
              </span>
              <span className={styles.summaryValue}>
                {formatPrice(selectedTotalPrice)}
              </span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>배송비</span>
              <span className={styles.summaryValue}>
                {deliveryFee === 0 ? '무료' : formatPrice(deliveryFee)}
              </span>
            </div>

            {deliveryFee > 0 && selectedTotalPrice > 0 && (
              <div className={styles.deliveryNote}>
                🚚 {formatPrice(50000 - selectedTotalPrice)} 더 담으면 무료배송!
              </div>
            )}

            <div className={styles.summaryDivider} />

            <div className={styles.summaryTotalRow}>
              <span className={styles.summaryTotalLabel}>총 결제 금액</span>
              <span className={styles.summaryTotalValue}>
                {formatPrice(finalTotal)}
              </span>
            </div>

            <button
              className={styles.checkoutBtn}
              onClick={handleCheckout}
              disabled={selectedCount === 0}
            >
              {selectedCount > 0
                ? `${selectedCount}개 상품 주문하기`
                : '상품을 선택해주세요'}
            </button>

            <Link href="/shop" className={styles.continueLink}>
              ← 쇼핑 계속하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
