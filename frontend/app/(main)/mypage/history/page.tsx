'use client';

import Button from '@/components/common/Button/Button';
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
      <OrderList orders={orders} statusFilter={statusFilter} onOpenDetail={openDetail} />
      <OrderDetailModal order={detailOrder} onClose={closeDetail} />
    </>
  );
}

