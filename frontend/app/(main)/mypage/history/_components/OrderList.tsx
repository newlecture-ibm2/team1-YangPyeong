'use client';

import { useRouter } from 'next/navigation';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import { ORDER_STATUS_MAP, type BuyerOrder, type OrderStatus } from '../../_lib/mypage.types';
import { formatPrice, formatDate } from '../_lib/history.utils';
import styles from '../page.module.css';

interface OrderListProps {
  orders: BuyerOrder[];
  statusFilter: OrderStatus | 'ALL';
  onOpenDetail: (order: BuyerOrder) => void;
}

/** 주문 카드 리스트 (빈 상태 포함) */
export default function OrderList({ orders, statusFilter, onOpenDetail }: OrderListProps) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon}>📦</p>
        <p className={styles.emptyText}>
          {statusFilter === 'ALL' ? '주문내역이 없습니다.' : '해당 상태의 주문이 없습니다.'}
        </p>
        {statusFilter === 'ALL' && (
          <Button variant="primary" onClick={() => router.push('/shop')}>
            쇼핑하러 가기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.orderList}>
      {orders.map((order) => {
        const statusInfo = ORDER_STATUS_MAP[order.status];
        return (
          <div
            key={order.id}
            className={styles.orderCard}
            onClick={() => onOpenDetail(order)}
          >
            {/* 카드 헤더 */}
            <div className={styles.orderHeader}>
              <div className={styles.orderMeta}>
                <span className={styles.orderNumber}>{order.orderNumber}</span>
                <span className={styles.orderDate}>{formatDate(order.orderedAt)}</span>
              </div>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            {/* 카드 바디 */}
            <div className={styles.orderBody}>
              <div className={styles.orderProduct}>
                <p className={styles.orderProductName}>{order.productSummary}</p>
                <p className={styles.orderProductItems}>
                  {order.items.length}개 상품
                </p>
              </div>
              <span className={styles.orderAmount}>{formatPrice(order.totalAmount)}</span>
              <button
                className={styles.orderDetailBtn}
                onClick={(e) => { e.stopPropagation(); onOpenDetail(order); }}
              >
                상세보기
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
