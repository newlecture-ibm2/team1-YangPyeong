'use client';

import Button from '@/components/common/Button/Button';
import Modal from '@/components/common/Modal/Modal';
import OrderSummary from './_components/OrderSummary';
import OrderFilterTabs from './_components/OrderFilterTabs';
import OrderList from './_components/OrderList';
import OrderDetailModal from './_components/OrderDetailModal';
import useOrderHistory from './useOrderHistory';
import styles from './page.module.css';

/** 구매자 주문내역 페이지 */
export default function MypageHistoryPage() {
  const {
    orders,
    loading,
    error,
    stats,
    statusFilter,
    setStatusFilter,
    detailOrder,
    openDetail,
    closeDetail,
    retry,
    cancelTarget,
    isCancelling,
    openCancelDialog,
    closeCancelDialog,
    handleCancelConfirm,
  } = useOrderHistory();

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>주문내역을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon}>⚠️</p>
        <p className={styles.emptyText}>{error}</p>
        <Button variant="primary" onClick={retry}>다시 시도</Button>
      </div>
    );
  }

  return (
    <>
      <OrderSummary stats={stats} />
      <OrderFilterTabs statusFilter={statusFilter} onFilterChange={setStatusFilter} />
      <OrderList orders={orders} statusFilter={statusFilter} onOpenDetail={openDetail} onOpenCancel={openCancelDialog} />
      <OrderDetailModal order={detailOrder} onClose={closeDetail} />

      {/* 주문 취소 모달 */}
      <Modal isOpen={!!cancelTarget} onClose={closeCancelDialog} title="주문 취소" size="sm">
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' }}>
            <strong>{cancelTarget?.orderNumber}</strong> 주문을 취소하시겠습니까?
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginTop: '8px' }}>
            취소된 주문은 되돌릴 수 없으며 재고가 즉시 복구됩니다.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button variant="outline" onClick={closeCancelDialog} disabled={isCancelling}>
              닫기
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCancelConfirm} 
              disabled={isCancelling} 
              style={{ background: 'var(--color-danger)' }}
            >
              {isCancelling ? '취소 중...' : '주문 취소'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

