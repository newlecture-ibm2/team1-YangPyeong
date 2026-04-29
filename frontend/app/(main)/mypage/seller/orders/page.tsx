'use client';

import { useState, useRef, useEffect } from 'react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Modal from '@/components/common/Modal/Modal';
import { ORDER_STATUS_MAP, ORDER_FILTER_TABS } from '../../_lib/mypage.types';
import type { OrderStatus } from '../../_lib/mypage.types';
import useSellerOrders from './useSellerOrders';
import styles from './page.module.css';

/** 다음 상태 전환 버튼 라벨 */
const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  ORDERED: '접수 확인',
  ACCEPTED: '배송 시작',
  SHIPPED: '배송 완료',
};

/** S-36. 판매 주문 관리 페이지 */
export default function SellerOrdersPage() {
  const {
    orders,
    kpi,
    statusFilter,
    setStatusFilter,
    advanceStatus,
    detailOrder,
    openDetail,
    closeDetail,
    cancelTarget,
    handleCancelRequest,
    confirmCancel,
    cancelCancelDialog,
  } = useSellerOrders();

  /** 드롭다운 메뉴 상태 */
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /** 외부 클릭 시 메뉴 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  /** 가격 포맷 */
  const formatPrice = (price: number) =>
    `₩${price.toLocaleString('ko-KR')}`;

  return (
    <>
      {/* KPI 카드 */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>신규 주문</span>
          <span className={styles.kpiValue}>{kpi.newOrders}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>배송 준비중</span>
          <span className={styles.kpiValue}>{kpi.preparing}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>배송중</span>
          <span className={styles.kpiValue}>{kpi.shipping}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
          <span className={styles.kpiLabel}>이번달 매출</span>
          <span className={styles.kpiValue}>{formatPrice(kpi.monthlySales)}</span>
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div className={styles.filterTabs}>
        {ORDER_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.filterTab} ${statusFilter === tab.value ? styles.filterTabActive : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 주문 테이블 */}
      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyText}>해당 상태의 주문이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문일</th>
                <th>구매자</th>
                <th className={styles.thLeft}>상품</th>
                <th>금액</th>
                <th>상태</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = ORDER_STATUS_MAP[order.status];
                const nextLabel = NEXT_ACTION_LABEL[order.status];
                return (
                  <tr
                    key={order.id}
                    className={styles.clickableRow}
                    onClick={() => openDetail(order)}
                  >
                    <td className={styles.tdOrderNumber}>{order.orderNumber}</td>
                    <td>{order.orderedAt}</td>
                    <td>{order.buyerName}</td>
                    <td className={styles.tdLeft}>{order.productName}</td>
                    <td className={styles.tdAmount}>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className={styles.actionCell} ref={openMenuId === order.id ? menuRef : undefined}>
                        <button
                          className={styles.kebabBtn}
                          onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                          aria-label="주문 처리 메뉴"
                        >
                          ⋮
                        </button>
                        {openMenuId === order.id && (
                          <div className={styles.dropdownMenu}>
                            <button
                              className={styles.menuItem}
                              onClick={() => { openDetail(order); setOpenMenuId(null); }}
                            >
                              <span>📋</span><span>상세보기</span>
                            </button>
                            {nextLabel && (
                              <button
                                className={`${styles.menuItem} ${styles.menuItemPrimary}`}
                                onClick={() => { advanceStatus(order.id); setOpenMenuId(null); }}
                              >
                                <span>✅</span><span>{nextLabel}</span>
                              </button>
                            )}
                            {order.status === 'ORDERED' && (
                              <button
                                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                onClick={() => { handleCancelRequest(order); setOpenMenuId(null); }}
                              >
                                <span>✕</span><span>주문 거절</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 주문 상세 모달 */}
      <Modal
        isOpen={!!detailOrder}
        onClose={closeDetail}
        title="주문 상세"
        size="md"
      >
        {detailOrder && (
          <div className={styles.detailModal}>
            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>주문 정보</h4>
              <dl className={styles.detailGrid}>
                <dt>주문번호</dt>
                <dd>{detailOrder.orderNumber}</dd>
                <dt>주문일</dt>
                <dd>{detailOrder.orderedAt}</dd>
                <dt>상태</dt>
                <dd>
                  <Badge variant={ORDER_STATUS_MAP[detailOrder.status].variant}>
                    {ORDER_STATUS_MAP[detailOrder.status].label}
                  </Badge>
                </dd>
              </dl>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>상품 정보</h4>
              <dl className={styles.detailGrid}>
                <dt>상품</dt>
                <dd>{detailOrder.productName}</dd>
                <dt>결제 금액</dt>
                <dd className={styles.detailPrice}>{formatPrice(detailOrder.totalAmount)}</dd>
              </dl>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>배송 정보</h4>
              <dl className={styles.detailGrid}>
                <dt>수령인</dt>
                <dd>{detailOrder.buyerName}</dd>
                <dt>연락처</dt>
                <dd>{detailOrder.buyerPhone}</dd>
                <dt>주소</dt>
                <dd>{detailOrder.shippingAddress}</dd>
                {detailOrder.shippingMemo && (
                  <>
                    <dt>배송 메모</dt>
                    <dd>{detailOrder.shippingMemo}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        )}
      </Modal>

      {/* 주문 거절 확인 모달 */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={cancelCancelDialog}
        title="주문 거절"
        size="sm"
      >
        <div className={styles.cancelModal}>
          <p>
            <strong>{cancelTarget?.orderNumber}</strong> 주문을 거절하시겠습니까?
          </p>
          <p className={styles.cancelWarning}>
            거절된 주문은 되돌릴 수 없으며, 구매자에게 취소 알림이 전송됩니다.
          </p>
          <div className={styles.cancelActions}>
            <Button variant="outline" onClick={cancelCancelDialog}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={confirmCancel}
              style={{ background: 'var(--color-danger)' }}
            >
              거절하기
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
