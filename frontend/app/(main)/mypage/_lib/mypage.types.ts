/* ════════════════════════════════════════════════════════
   마이페이지 공통 타입 및 상수 정의
   ════════════════════════════════════════════════════════ */

// ── 주문 관련 ──

/** 주문 상태 */
export type OrderStatus =
  | 'ORDERED'
  | 'ACCEPTED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

/** 주문 상태 → 라벨/배지 매핑 */
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: 'green' | 'lime' | 'orange' | 'red' | 'gray' | 'blue' | 'purple' }> = {
  ORDERED:   { label: '주문접수', variant: 'blue' },
  ACCEPTED:  { label: '준비중',   variant: 'orange' },
  SHIPPED:   { label: '배송중',   variant: 'purple' },
  COMPLETED: { label: '배송완료', variant: 'green' },
  CANCELLED: { label: '취소됨',   variant: 'red' },
};

/** 주문 필터 탭 */
export const ORDER_FILTER_TABS: { label: string; value: OrderStatus | 'ALL' }[] = [
  { label: '전체',     value: 'ALL' },
  { label: '주문접수', value: 'ORDERED' },
  { label: '준비중',   value: 'ACCEPTED' },
  { label: '배송중',   value: 'SHIPPED' },
  { label: '배송완료', value: 'COMPLETED' },
  { label: '취소됨',   value: 'CANCELLED' },
];

/** 판매자 주문 DTO */
export interface SellerOrder {
  id: number;
  orderNumber: string;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  shippingMemo?: string;
  productName: string;
  productId: number;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  /** 접수(상태변경) 시각 — 배송 예정 시간 계산용 */
  acceptedAt?: string;
  trackingNumber?: string;
  shippedAt?: string;
}

/** 판매자 주문 KPI */
export interface SellerOrderKpi {
  newOrders: number;
  preparing: number;
  shipping: number;
  monthlySales: number;
}

// ── 구매자 주문 관련 ──

/** 구매자 주문 DTO */
export interface BuyerOrder {
  id: number;
  orderNumber: string;
  productSummary: string;
  items: BuyerOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMemo?: string;
  trackingNumber?: string;
  shippedAt?: string;
  orderedAt: string;
}

/** 구매자 주문 항목 */
export interface BuyerOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** 구매자 주문 필터 탭 (판매자와 동일 — ORDER_FILTER_TABS 재사용) */
export const BUYER_ORDER_FILTER_TABS = ORDER_FILTER_TABS;

// ── 상품 관련 ──

/** 상품 상태 */
export type ProductStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SOLDOUT' | 'REJECTED';

/** 상품 상태 → 라벨/배지 매핑 */
export const PRODUCT_STATUS_MAP: Record<ProductStatus, { label: string; variant: 'green' | 'orange' | 'red' | 'gray' | 'blue' | 'yellow' }> = {
  PENDING:  { label: '검수중', variant: 'yellow' },
  ACTIVE:   { label: '판매중', variant: 'green' },
  SOLDOUT:  { label: '품절',   variant: 'orange' },
  INACTIVE: { label: '숨김',   variant: 'gray' },
  REJECTED: { label: '반려됨', variant: 'red' },
};

/** 상품 카테고리 목록 */
export const PRODUCT_CATEGORIES = [
  '채소',
  '과일',
  '곡물',
  '견과류',
  '축산',
  '수산',
  '가공식품',
  '기타',
] as const;

/** 판매자 상품 DTO */
export interface SellerProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  salesCount: number;
  status: ProductStatus;
  imageUrls: string[];
  categoryName: string;
  description: string;
  createdAt: string;
}
