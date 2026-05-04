import { BUYER_ORDER_FILTER_TABS, type OrderStatus } from '../../_lib/mypage.types';
import styles from '../page.module.css';

interface OrderFilterTabsProps {
  statusFilter: OrderStatus | 'ALL';
  onFilterChange: (value: OrderStatus | 'ALL') => void;
}

/** 주문 상태 필터 탭 */
export default function OrderFilterTabs({ statusFilter, onFilterChange }: OrderFilterTabsProps) {
  return (
    <div className={styles.filterTabs}>
      {BUYER_ORDER_FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          className={`${styles.filterTab} ${statusFilter === tab.value ? styles.filterTabActive : ''}`}
          onClick={() => onFilterChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
