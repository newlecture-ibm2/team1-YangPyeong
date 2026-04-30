/* ════════════════════════════════════════════════════════
   Mypage 도메인 — 타입 정의
   ════════════════════════════════════════════════════════ */

/** 상품 상태 */
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'SOLDOUT';

/** 판매 상품 */
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

/** 상품 등록/수정 폼 데이터 */
export interface ProductFormData {
  name: string;
  price: string;
  stock: string;
  categoryName: string;
  description: string;
  images: File[];
  existingImageUrls: string[];
}

/** 주문 상태 */
export type OrderStatus = 'ORDERED' | 'ACCEPTED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

/** 주문 상태 라벨 매핑 */
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: 'orange' | 'lime' | 'green' | 'gray' | 'red' }> = {
  ORDERED: { label: '신규', variant: 'orange' },
  ACCEPTED: { label: '배송 준비', variant: 'lime' },
  SHIPPED: { label: '배송중', variant: 'green' },
  COMPLETED: { label: '완료', variant: 'gray' },
  CANCELLED: { label: '취소', variant: 'red' },
};

/** 상품 상태 라벨 매핑 */
export const PRODUCT_STATUS_MAP: Record<ProductStatus, { label: string; variant: 'green' | 'gray' | 'red' }> = {
  ACTIVE: { label: '판매중', variant: 'green' },
  INACTIVE: { label: '숨김', variant: 'gray' },
  SOLDOUT: { label: '품절', variant: 'red' },
};

/** 판매 주문 */
export interface SellerOrder {
  id: number;
  orderNumber: string;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  shippingMemo: string;
  productName: string;
  productId: number;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
}

/** 판매 주문 KPI */
export interface SellerOrderKpi {
  newOrders: number;
  preparing: number;
  shipping: number;
  monthlySales: number;
}

/** 주문 상태 필터 탭 */
export const ORDER_FILTER_TABS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ORDERED', label: '신규' },
  { value: 'ACCEPTED', label: '배송 준비' },
  { value: 'SHIPPED', label: '배송중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

/** 상품 카테고리 옵션 */
export const PRODUCT_CATEGORIES = [
  '채소류',
  '과일류',
  '곡물·잡곡',
  '가공식품',
] as const;
