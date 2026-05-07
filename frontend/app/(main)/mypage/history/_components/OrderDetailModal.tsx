import Badge from '@/components/common/Badge/Badge';
import Modal from '@/components/common/Modal/Modal';
import { ORDER_STATUS_MAP, type BuyerOrder } from '../../_lib/mypage.types';
import { formatPrice, formatDate } from '../_lib/history.utils';
import styles from '../page.module.css';

interface OrderDetailModalProps {
  order: BuyerOrder | null;
  onClose: () => void;
}

/** 주문 상세 모달 */
export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      title="주문 상세"
      size="md"
    >
      {order && (
        <div className={styles.detailModal}>
          {/* 주문 정보 */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>주문 정보</h4>
            <dl className={styles.detailGrid}>
              <dt>주문번호</dt>
              <dd>{order.orderNumber}</dd>
              <dt>주문일</dt>
              <dd>{formatDate(order.orderedAt)}</dd>
              <dt>상태</dt>
              <dd>
                <Badge variant={ORDER_STATUS_MAP[order.status].variant}>
                  {ORDER_STATUS_MAP[order.status].label}
                </Badge>
              </dd>
            </dl>
          </div>

          {/* 주문 상품 */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>주문 상품</h4>
            <div className={styles.itemList}>
              {order.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className={styles.itemRow}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemQty}>{item.quantity}개</span>
                  <span className={styles.itemSubtotal}>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <div className={styles.itemTotal}>
                <span className={styles.itemTotalLabel}>합계</span>
                <span className={styles.itemTotalAmount}>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 배송 정보 */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>배송 정보</h4>
            <dl className={styles.detailGrid}>
              <dt>수령인</dt>
              <dd>{order.receiverName}</dd>
              <dt>연락처</dt>
              <dd>{order.receiverPhone}</dd>
              <dt>주소</dt>
              <dd>{order.shippingAddress}</dd>
              {order.shippingMemo && (
                <>
                  <dt>배송 메모</dt>
                  <dd>{order.shippingMemo}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      )}
    </Modal>
  );
}
