import { formatPrice } from '../_lib/history.utils';
import styles from '../page.module.css';

interface OrderSummaryProps {
  stats: {
    total: number;
    ordered: number;
    shipping: number;
    totalSpent: number;
  };
}

/** 주문내역 요약 카드 */
export default function OrderSummary({ stats }: OrderSummaryProps) {
  return (
    <div className={styles.summaryRow}>
      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>전체 주문</span>
        <span className={styles.summaryValue}>{stats.total}</span>
      </div>
      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>처리중</span>
        <span className={styles.summaryValue}>{stats.ordered}</span>
      </div>
      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>배송중</span>
        <span className={styles.summaryValue}>{stats.shipping}</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardHighlight}`}>
        <span className={styles.summaryLabel}>총 결제금액</span>
        <span className={styles.summaryValue}>{formatPrice(stats.totalSpent)}</span>
      </div>
    </div>
  );
}
